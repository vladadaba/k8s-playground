kubectl config set-context --current --namespace=myapp

# minikube plugins
minikube addons enable metrics-server
minikube addons enable registry # needed for kafka-connect image with debezium postgresql connector (need to use strimzi kafka-connect image because of some startup script)

REGISTRY_IP=$(kubectl get svc -n kube-system registry -o jsonpath='{.spec.clusterIP}')
yq eval "(select(.kind == \"KafkaConnect\") | .spec.build.output.image = \"$REGISTRY_IP:80/my-debezium-connect:test/\") // ." -i helm/infra/kafka.yml

# for strimzi operator, need to build docker image for arm architecture
# git clone https://github.com/lsst-sqre/strimzi-registry-operator.git ../strimzi-registry-operator
cd ../strimzi-registry-operator/minikube
./buildimage.sh
cd -

kubectl create namespace kafka
kubectl create namespace myapp
kubectl create namespace keycloak

# Add kubernetes-dashboard repository
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
# Deploy a Helm Release named "kubernetes-dashboard" using the kubernetes-dashboard chart
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard
# Create user to access dashboard
kubectl apply -f ./helm/infra/k8s-dashboard-user

# postgres-operator
helm repo add postgres-operator-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator
helm install postgres-operator postgres-operator-charts/postgres-operator --create-namespace -n postgres
## postgres-operator-ui
# helm repo add postgres-operator-ui-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator-ui --create-namespace -n postgres
# helm install postgres-operator-ui postgres-operator-ui-charts/postgres-operator-ui --create-namespace -n postgres

kubectl -n myapp apply -f ./helm/infra/postgres.yml

# strimzi-operator
# https://strimzi.io/quickstarts/
# TODO: deploy operator in its own namespace, need to figure rolebindings
kubectl create -f 'https://strimzi.io/install/latest?namespace=myapp' -n myapp
# KafkaConnectors might need to wait for KafkaConnect to start before they are applied?
kubectl create -f ./helm/infra/kafka.yml -n myapp
kubectl create -f ./helm/infra/kafka-connect-rolebinding.yml -n myapp

# wait for cluster to start then
kubectl wait kafka/kafka --for condition=Ready --timeout=360s

kubectl create -f ./helm/infra/kafka-connectors.yml -n myapp

# NOTE: below works for amd64 architecture
# helm repo add lsstsqre https://lsst-sqre.github.io/charts/
# helm install ssr lsstsqre/strimzi-registry-operator --set clusterNamespace="myapp",clusterName="kafka"

kubectl -n myapp apply -f ./helm/infra/kafka-schema-registry-crd.yml
kubectl -n myapp apply -f ./helm/infra/strimzi-schema-registry-operator.yml

# https://github.com/lsst-sqre/strimzi-registry-operator/pkgs/container/strimzi-registry-operator#deploy-a-schema-registry
kubectl -n myapp apply -f ./helm/infra/kafka-schema-registry-topic-user.yml
kubectl wait kafkatopic/registry-schemas --for=condition=Ready --timeout=300s
kubectl wait kafkauser/confluent-schema-registry --for=condition=Ready --timeout=300s
sleep 5s

# wait for secret confluent-schema-registry to be created from above command
kubectl -n myapp apply -f ./helm/infra/kafka-schema-registry.yml

# redis-operator
helm repo add ot-helm https://ot-container-kit.github.io/helm-charts/
helm install redis-operator ot-helm/redis-operator --create-namespace -n redis

# traefik
helm repo add traefik https://helm.traefik.io/traefik
helm install -f ./helm/infra/traefik/values.yml traefik traefik/traefik --create-namespace --namespace traefik

# keycloak
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloaks.k8s.keycloak.org-v1.yml
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloakrealmimports.k8s.keycloak.org-v1.yml
kubectl -n myapp apply -f ./helm/infra/keycloak/keycloak-operator-role-bindings.yml
kubectl -n keycloak apply -f ./helm/infra/keycloak/keycloak-operator.yml

# redis 
kubectl -n myapp create secret generic redis-secret --from-literal=password=$(openssl rand 18 | base64)
kubectl -n myapp apply -f ./helm/infra/redis.yml

# traefik
kubectl -n myapp apply -f ./helm/infra/traefik-cors-middleware.yml

# temporal
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.10.1/cert-manager.yaml

# wait for all cert-manager pods to be ready (I think only webhook is required but it takes the longest to start anyway)
kubectl wait pods --all --for condition=Ready --namespace=cert-manager --timeout=360s
kubectl apply --server-side -f https://github.com/alexandrevilain/temporal-operator/releases/latest/download/temporal-operator.crds.yaml
kubectl apply -f https://github.com/alexandrevilain/temporal-operator/releases/latest/download/temporal-operator.yaml

kubectl wait pods --all --for condition=Ready --namespace=temporal-system --timeout=360s
kubectl -n myapp apply -f ./helm/infra/temporal.yml

PG_MASTER=$(kubectl get pods -o jsonpath={.items..metadata.name} -l cluster-name=postgres -n myapp)
kubectl port-forward $PG_MASTER 6432:5432 -n myapp &
sleep 5
PG_PASSWORD=$(kubectl get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' | base64 -d)
PG_USER=$(kubectl get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.username}' | base64 -d)
PGPASSWORD=$PG_PASSWORD psql -U postgres -h localhost -p 6432 -c "CREATE SCHEMA keycloak; CREATE SCHEMA cart; CREATE SCHEMA users; CREATE SCHEMA inventory; CREATE SCHEMA orders;"

# kubectl -n myapp create secret tls keycloak-tls-secret --cert ./helm/infra/keycloak/certificate.pem --key ./helm/infra/keycloak/key.pem
kubectl create secret generic keycloak-confidential-client-secret --from-literal=secret=$(openssl rand 30 | base64)
kubectl -n myapp apply -f ./helm/infra/keycloak.yml

# deploy apps
# helm dependency update ./helm/apps/orders-svc
# helm install orders-svc ./helm/apps/orders-svc

# helm dependency update ./helm/apps/inventory-svc
# helm install inventory-svc ./helm/apps/inventory-svc

# helm dependency update ./helm/apps/users-svc
# helm install users-svc ./helm/apps/users-svc

# helm dependency update ./helm/apps/cart-svc
# helm install cart-svc ./helm/apps/cart-svc

# helm dependency update ./helm/apps/notifications-svc
# helm install notifications-svc ./helm/apps/notifications-svc

# helm dependency update ./helm/apps/temporal-worker
# helm install temporal-worker ./helm/apps/temporal-worker


# TODO: deploy observability tools (Grafana LGTM)
