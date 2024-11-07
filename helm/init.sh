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

# deploying infra
kubectl apply -f ./helm/infra/dapr.yml -n dapr
kubectl apply -f ./helm/infra/postgres.yml -n postgres
kubectl apply -f ./helm/infra/rabbitmq.yml -n rabbitmq
kubectl apply -f ./helm/infra/redis.yml -n redis 

# TODO:
kubectl apply -f ./helm/infra/debezium.yml -n debezium
kubectl apply -f ./helm/infra/traefik.yml -n traefik
kubectl apply -f ./helm/infra/keycloak.yml -n keycloak

# TODO: deploy apps
