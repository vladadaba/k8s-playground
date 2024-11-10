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
helm install -f ./helm/infra/traefik/values.yml traefik traefik/traefik --create-namespace --namespace traefik

kubectl create namespace myapp
kubectl create namespace keycloak

# keycloak
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloaks.k8s.keycloak.org-v1.yml
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloakrealmimports.k8s.keycloak.org-v1.yml
kubectl -n myapp apply -f ./helm/infra/keycloak/keycloak-operator-role-bindings.yml
kubectl -n keycloak apply -f ./helm/infra/keycloak/keycloak-operator.yml

# dapr
helm repo add dapr https://dapr.github.io/helm-charts/
helm install dapr dapr/dapr --create-namespace -n dapr

# debezium
helm repo add debezium https://charts.debezium.io
helm install my-debezium-operator debezium/debezium-operator --version 3.0.0-final --create-namespace -n debezium

# deploying infra
kubectl -n myapp apply -f ./helm/infra/postgres.yml
kubectl -n myapp apply -f ./helm/infra/rabbitmq.yml
kubectl -n myapp apply -f ./helm/infra/redis.yml
kubectl -n myapp apply -f ./helm/infra/secrets.yml
kubectl -n myapp apply -f ./helm/infra/dapr.yml
kubectl -n myapp apply -f ./helm/infra/traefik-cors-middleware.yml

# TODO: need to create schemas keycloak, users, inventory, orders in database when postgres starts
# PG_MASTER=$(kubectl get pods -o jsonpath={.items..metadata.name} -l cluster-name=postgres -n myapp)
# kubectl port-forward $PG_MASTER 6432:5432 -n myapp
PG_PASSWORD=$(kubectl get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' | base64 -d)
PG_USER=$(kubectl get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.username}' | base64 -d)
PGPASSWORD=$PG_PASSWORD psql -U postgres -h localhost -p 6432 -c "CREATE SCHEMA keycloak; CREATE SCHEMA users; CREATE SCHEMA inventory; CREATE SCHEMA orders;"

# apply migrations
cd apps/orders-svc
DATABASE_URL="postgresql://$PG_USER:$PG_PASSWORD@localhost:6432/postgres?schema=orders" npx prisma db push
cd ../..

# Create debezium-secret using --from-literal
# TODO: research better way to do this
RABBITMQ_USER=$(kubectl -n myapp get secret rabbitmq-default-user -o jsonpath="{.data.username}" | base64 --decode)
RABBITMQ_PASSWORD=$(kubectl -n myapp get secret rabbitmq-default-user -o jsonpath="{.data.password}" | base64 --decode)
PG_USER=$(kubectl -n myapp get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.username}' -n myapp | base64 -d)
PG_PASSWORD=$(kubectl -n myapp get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' -n myapp | base64 -d)
REDIS_PASSWORD=$(kubectl -n myapp get secret redis-secret -o jsonpath="{.data.password}" | base64 --decode)
kubectl -n myapp create secret generic debezium-secret \
  --from-literal=RABBITMQ_USER="$RABBITMQ_USER" \
  --from-literal=RABBITMQ_PASSWORD="$RABBITMQ_PASSWORD" \
  --from-literal=PG_USER="$PG_USER" \
  --from-literal=PG_PASSWORD="$PG_PASSWORD" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD"

kubectl -n myapp create secret tls keycloak-tls-secret --cert ./helm/infra/keycloak/certificate.pem --key ./helm/infra/keycloak/key.pem

kubectl -n myapp apply -f ./helm/infra/debezium.yml
kubectl -n myapp apply -f ./helm/infra/keycloak.yml

# get keycloak confidential client secret and add it to k8s secret
kubectl get secret keycloak-initial-admin -o 'jsonpath={.data.username}' -n myapp | base64 -d
kubectl get secret keycloak-initial-admin -o 'jsonpath={.data.password}' -n myapp | base64 -d
kubectl port-forward keycloak-0 8443:8443 -n myapp
# kubectl create secret generic keycloak-client-secret --from-literal=CONFIDENTIAL_CLIENT_SECRET=<secret>

# deploy apps
helm dependency update ./helm/apps/orders-svc
helm install orders-svc ./helm/apps/orders-svc

helm dependency update ./helm/apps/inventory-svc
helm install inventory-svc ./helm/apps/inventory-svc

helm dependency update ./helm/apps/users-svc
helm install users-svc ./helm/apps/users-svc

helm dependency update ./helm/apps/notifications-svc
helm install notifications-svc ./helm/apps/notifications-svc

# TODO: run migrations

# TODO: deploy observability tools