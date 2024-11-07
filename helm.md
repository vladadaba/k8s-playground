# Apps

Command to update dependencies. Run it when you update shared library.

```
helm dependency update ./app1
```

Command to dry run

```
helm install --dry-run --disable-openapi-validation moldy-jaguar ./app1
```

### Dapr sidecar injector

When running Dapr in K8s, `dapr-sidecar-injector` deployment is created which monitors pods for annotations and injects Dapr sidecar into pods.

https://docs.dapr.io/concepts/dapr-services/sidecar-injector/

`resource-path` is not supported in annotations, instead we need to use Dapr's CustomResourceDescription and apply them to cluster directly (`helm/infra/dapr.yml`). This includes `config.yaml` as well.

`dapr.io/env` needs `APP_API_TOKEN` some secrets which can be configured like this https://v1-15.docs.dapr.io/operations/configuration/environment-variables-secrets/

# Managing cluster

### k8s dashboard

https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/

```
# Add kubernetes-dashboard repository
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
# Deploy a Helm Release named "kubernetes-dashboard" using the kubernetes-dashboard chart
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard
```

To open

```
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443
```

https://localhost:8443/#/login

To get Bearer token https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md#getting-a-long-lived-bearer-token-for-serviceaccount

```
kubectl get secret admin-user -n kubernetes-dashboard -o jsonpath={".data.token"} | base64 -d
```

# Infra

Operators can be searched here https://operatorhub.io/ with their capabilities (level 1, 2, 3, 4, 5) on the right sidebar.

### Postgres

https://postgres-operator.readthedocs.io/en/latest/user/

https://github.com/zalando/postgres-operator/blob/master/docs/quickstart.md

```
# add repo for postgres-operator
helm repo add postgres-operator-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator --create-namespace -n postgres

# install the postgres-operator
helm install postgres-operator postgres-operator-charts/postgres-operator --create-namespace -n postgres

# add repo for postgres-operator-ui
helm repo add postgres-operator-ui-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator-ui --create-namespace -n postgres

# install the postgres-operator-ui
helm install postgres-operator-ui postgres-operator-ui-charts/postgres-operator-ui --create-namespace -n postgres
```

Get credentials:

https://postgres-operator.readthedocs.io/en/latest/user/#:~:text=acid%2Dminimal%2Dcluster-,Connect%20to%20PostgreSQL,-With%20a%20port

```
kubectl get secrets -n myapp
kubectl get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' -n myapp | base64 -d
```

### RabbitMQ

https://www.rabbitmq.com/kubernetes/operator/install-operator#helm-chart

```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install rabbitmq-operator bitnami/rabbitmq-cluster-operator
```

Deploy cluster:

https://www.rabbitmq.com/kubernetes/operator/using-operator#create

Get credentials:

https://www.rabbitmq.com/kubernetes/operator/using-operator#creds

```
kubectl -n myapp get secret rabbitmq-default-user -o jsonpath="{.data.password}" | base64 --decode
```

### Redis

https://github.com/OT-CONTAINER-KIT/redis-operator

```
helm repo add ot-helm https://ot-container-kit.github.io/helm-charts/
helm upgrade redis-operator ot-helm/redis-operator --install
```

Example charts are at https://github.com/OT-CONTAINER-KIT/redis-operator/tree/master/charts

https://ot-container-kit.github.io/redis-operator/guide/setup.html#redis-cluster

### Traefik

https://doc.traefik.io/traefik/getting-started/install-traefik/#use-the-helm-chart

https://github.com/traefik/traefik-helm-chart

https://github.com/traefik/traefik-helm-chart/blob/master/EXAMPLES.md

https://github.com/traefik/traefik-helm-chart/blob/master/traefik/values.yaml

```
helm repo add traefik https://helm.traefik.io/traefik
helm install -f ./helm/infra/traefik/values.yml traefik traefik/traefik --create-namespace --namespace traefik
```

TLS Cert TODO:

https://github.com/traefik/traefik-helm-chart/blob/master/EXAMPLES.md#use-traefik-native-lets-encrypt-integration-without-cert-manager

Access dashboard

```
kubectl port-forward $(kubectl -n traefik get pods --selector "app.kubernetes.io/name=traefik" --output=name) 8080:8080
```

http://127.0.0.1:8080/dashboard/#/

### Keycloak

https://www.keycloak.org/operator/installation

Installing by using kubectl without Operator Lifecycle Manager

1. Install the CRDs by entering the following commands:

```
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloaks.k8s.keycloak.org-v1.yml
kubectl apply -f https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/26.0.5/kubernetes/keycloakrealmimports.k8s.keycloak.org-v1.yml
```

2. Install the Keycloak Operator deployment by entering the following command:

```
kubectl apply -f ./helm/infra/keycloak-operator.yml
```

3. Deployment

https://www.keycloak.org/operator/basic-deployment

### Dapr Placement

https://github.com/dapr/dapr/blob/master/charts/dapr/README.md

1. Add dapr.github.io as an helm repo

```
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update
```

1. Install the Dapr chart on your cluster in the dapr namespace:

```
helm install dapr dapr/dapr --namespace dapr --create-namespace --wait
```

### Debezium

https://github.com/debezium/debezium-operator?tab=readme-ov-file

```
helm repo add debezium https://charts.debezium.io
helm install my-debezium-operator debezium/debezium-operator --version 3.0.0-final
```

# Troubleshooting

> Helm release stuck in `uninstalling` state

https://stackoverflow.com/questions/74050419/helm-release-stuck-in-uninstalling-state

```bash
helm hist releasename
helm rollback releasename versionnumber-with-status-deployed

# if this did not help, then delete secret for each version
# this is necessary if CRD is deleted
helm hist releasename
kubectl get secrets
k delete secrets sh.helm.release.v1.name.VERSION-N
```
