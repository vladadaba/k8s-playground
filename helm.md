# Initial setup

### Start Minikube

```
minikube start --cpus 8 --memory 16GB --disk-size 100GB --driver=qemu --network=socket_vmnet
```

### Setup kubectl context

So I don't have to run `-n myapp` every time.

```
kubectl config set-context --current --namespace=myapp
```

# Apps

Command to update dependencies. Run it when you update shared library.

```
helm dependency update ./orders-svc
```

Command to dry run

```
helm install --dry-run --disable-openapi-validation moldy-jaguar ./orders-svc
```

Install

```
docker build -t k8s_playground-notifications-svc . -f apps/notifications-svc/Dockerfile && minikube image load k8s_playground-notifications-svc
minikube image load k8s_playground-notifications-svc
helm install orders-svc ./orders-svc
```

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

Manifest reference:

https://opensource.zalando.com/postgres-operator/docs/reference/cluster_manifest.html

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

Connect to db using `psql`:

https://opensource.zalando.com/postgres-operator/docs/user.html#connect-to-postgresql

```
PG_MASTER=$(kubectl get pods -o jsonpath={.items..metadata.name} -l cluster-name=postgres -n myapp)
kubectl port-forward $PG_MASTER 6432:5432 -n myapp

PGSSLMODE=require
PGPASSWORD=$(kubectl get secret postgres.postgres.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' | base64 -d) psql -U postgres -h localhost -p 6432
```

Check disk usage:

```
kubectl exec -it postgres-0 -- df -h /home/postgres/pgdata
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
kubectl -n traefik port-forward $(kubectl -n traefik get pods --selector "app.kubernetes.io/name=traefik" --output=name) 8080:8080
```

http://127.0.0.1:8080/dashboard/#/

Port forward ingressroutes:

```
kubectl -n traefik port-forward $(kubectl -n traefik get pods --selector "app.kubernetes.io/name=traefik" --output=name) 8000:8000

# test
curl http://localhost:8000/orders-svc/hello
```

To find port (8000), click on any router on the dashboard and it will say on which port it is listening for that PathPrefix.

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

```
openssl req -subj '/CN=keycloak/O=Test Keycloak./C=US' -newkey rsa:2048 -nodes -keyout ./helm/infra/keycloak/key.pem -x509 -days 365 -out ./helm/infra/keycloak/certificate.pem
kubectl -n myapp create secret tls keycloak-tls-secret --cert ./helm/infra/keycloak/certificate.pem --key ./helm/infra/keycloak/key.pem
```

Admin credentials

https://www.keycloak.org/operator/advanced-configuration

> When you create a new instance the Keycloak CR `spec.bootstrapAdmin` stanza may be used to configure the bootstrap user and/or service account. If you do not specify anything for the `spec.bootstrapAdmin`, the operator will create a Secret named "metadata.name"-initial-admin with a username **temp-admin** and a generated password. If you specify a Secret name for bootstrap admin user, then the Secret will need to contain username and password key value pairs. If you specify a Secret name for bootstrap admin service account, then the Secret will need to contain client-id and client-secret key value pairs.

```
kubectl get secret keycloak-initial-admin -o 'jsonpath={.data.username}' -n myapp | base64 -d
kubectl get secret keycloak-initial-admin -o 'jsonpath={.data.password}' -n myapp | base64 -d
kubectl get pods
kubectl port-forward keycloak-0 8080:8080 -n myapp
```

### Debezium

Minikube regsitry is needed for Kafka connect custom built image with debezium plugin:

```
minikube addons enable registry
```

CRD `KafkaConnect` will build and push image to minikube's rgistry which can be checked like this:

```
kubectl port-forward --namespace kube-system service/registry 5000:80
curl http://localhost:5000/v2/_catalog

> {"repositories":["my-debezium-connect"]}
```

We will need to change IP of minikube's registry when restarting minikube (used in KafkaConnect `build` block, e.g. `10.110.8.103:80:80/my-debezium-connect:test`):

```
kubectl get svc -n kube-system registry
```

https://github.com/debezium/debezium-operator?tab=readme-ov-file

```
helm repo add debezium https://charts.debezium.io
helm install my-debezium-operator debezium/debezium-operator --version 3.0.0-final
```

# Accessing application

```
kubectl -n traefik port-forward $(kubectl -n traefik get pods --selector "app.kubernetes.io/name=traefik" --output=name) 8080:8000

kubectl -n traefik port-forward $(kubectl -n traefik get pods --selector "app.kubernetes.io/name=traefik" --output=name) 8081:8080

kubectl -n traefik port-forward $(kubectl -n traefik get pods --selector "app.kubernetes.io/name=traefik" --output=name) 8443:8443
```

Traefik dashboard: http://localhost:8081/dashboard/#/http/routers
Keycloak: http://localhost:8080/admin
Apps: http://localhost:8000/cart

# Troubleshooting

### Troubleshooting resource usage

```
# cpu and memory usage
minikube addons enable metrics-server
minikube dashboard # will install metrics api which will allow below command
kubectl top pods

# disk usage (/home/postgres/pgdata can be found in describe pod)
kubectl describe pod postgres-0
kubectl exec -it postgres-0 -- df -h /home/postgres/pgdata
```

### Helm release stuck in `uninstalling` state

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

### Pod logs

Check logs from another container

```
kubectl describe pod <pod-name>
kubectl logs <pod-name> -c <container-name>
```

### Debugging helm charts

```
helm template orders-svc -s templates/app.yml -f orders-svc/values.yaml --debug
```

> While actively working on a chart we can do this
>
> If one chart depends on another, you can put an unpacked copy of the dependency into the parent chart's charts subdirectory.
>
> This should work with a symlink, too. So if you're actively working on the subchart but need to install it via > the parent, you should be able to

```
cd charts
ln -s ../../_helpers helpers-0.1.0
```
