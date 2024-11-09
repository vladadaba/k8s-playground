# Minikube

```
minikube start --cpus 8 --memory 16GB --disk-size 100GB --driver=qemu --network=socket_vmnet
```

Defaults = cpus: 2, memory: 2048

# Traefik

To use `IngressRoute` custom resource definition, we need to install the following https://doc.traefik.io/traefik/providers/kubernetes-crd/

### Install Traefik Resource Definitions:

```
kubectl apply -f https://raw.githubusercontent.com/traefik/traefik/v3.1/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml
```

### Install RBAC for Traefik:

```
kubectl apply -f https://raw.githubusercontent.com/traefik/traefik/v3.1/docs/content/reference/dynamic-configuration/kubernetes-crd-rbac.yml
```

# Keycloak

1. Have to run `000_keycloak_user.sql` in postgres to create `keycloak` user and DB.
2. Have to update `/etc/hosts` file with nodeport url mapped to `keycloak` (because Keycloak redirects to that hostname)
3. Create Realm, public and confidential client, `admin` and `user` groups, roles and users (and attach users and roles to groups)
4. Get confidential client secret and put it in `envvar-configmap.yml`

# Database

1. Run migrations

```
minikube service postgres-nodeport-service --url
DATABASE_URL="postgresql://postgres:postgres@192.168.105.2:32345/postgres?schema=public" npx prisma db push
```

2. Create users with id being `sub` from jwt (keycloak id?)

# How to fresh start a deployment that uses PersistentVolumeClaim (like when deleting volume in docker compose when we want fresh start)

https://www.reddit.com/r/kubernetes/comments/ujjwil/persistent_volume_data_not_getting_deleted_post/

> Minikube saves your PV data in the Minikube Docker container at /data/minikube/PVC-name. Deleting a PV does not delete these folders, and Minikube will not attempt to clear them before using them again. Use a different PV / PVC name or manually delete these folders to get a fresh slate.
