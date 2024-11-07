# Add kubernetes-dashboard repository
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
# Deploy a Helm Release named "kubernetes-dashboard" using the kubernetes-dashboard chart
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard
# Create user to access dashboard
kubectl apply -f ./infra/k8s-dashboard-user

# postgres-operator
helm repo add postgres-operator-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator
helm install postgres-operator postgres-operator-charts/postgres-operator --create-namespace -n postgres
## postgres-operator-ui
# helm repo add postgres-operator-ui-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator-ui --create-namespace -n postgres
# helm install postgres-operator-ui postgres-operator-ui-charts/postgres-operator-ui --create-namespace -n postgres

# rabbitmq-operator
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install rabbitmq-operator bitnami/rabbitmq-cluster-operator --create-namespace -n rabbitmq

# redis-operator
helm repo add ot-helm https://ot-container-kit.github.io/helm-charts/
helm install redis-operator ot-helm/redis-operator --create-namespace -n redis

# traefik
helm repo add traefik https://helm.traefik.io/traefik
helm install traefik-operator traefik/traefik --create-namespace -n traefik

# keycloak
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloaks.k8s.keycloak.org-v1.yml
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloakrealmimports.k8s.keycloak.org-v1.yml
kubectl create namespace keycloak
kubectl apply -f ./helm/infra/keycloak-operator.yml -n keycloak

# dapr
helm repo add dapr https://dapr.github.io/helm-charts/
helm install dapr dapr/dapr --create-namespace -n dapr

# debezium
helm repo add debezium https://charts.debezium.io
helm install my-debezium-operator debezium/debezium-operator --version 3.0.0-final --create-namespace -n debezium

kubectl create namespace myapp

# deploying infra
kubectl -n myapp apply -f ./helm/infra/secrets.yml
kubectl -n myapp apply -f ./helm/infra/dapr.yml
kubectl -n myapp apply -f ./helm/infra/postgres.yml
kubectl -n myapp apply -f ./helm/infra/rabbitmq.yml
kubectl -n myapp apply -f ./helm/infra/redis.yml

# Create debezium-secret using --from-literal
# TODO: research better way to do this
RABBITMQ_USER=$(kubectl -n myapp get secret rabbitmq-default-user -o jsonpath="{.data.username}" | base64 --decode)
RABBITMQ_PASSWORD=$(kubectl -n myapp get secret rabbitmq-default-user -o jsonpath="{.data.password}" | base64 --decode)
PG_PASSWORD=$(kubectl -n myapp get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' -n myapp | base64 -d)
REDIS_PASSWORD=$(kubectl -n myapp get secret redis-secret -o jsonpath="{.data.password}" | base64 --decode)
kubectl -n myapp create secret generic debezium-secret \
  --from-literal=RABBITMQ_USER="$RABBITMQ_USER" \
  --from-literal=RABBITMQ_PASSWORD="$RABBITMQ_PASSWORD" \
  --from-literal=PG_PASSWORD="$PG_PASSWORD" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD"
kubectl -n myapp apply -f ./helm/infra/debezium.yml

kubectl -n myapp apply -f ./helm/infra/traefik.yml
kubectl -n myapp apply -f ./helm/infra/keycloak.yml

# TODO: deploy apps
