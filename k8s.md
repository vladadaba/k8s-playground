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
DATABASE_URL="postgresql://postgres:postgres@192.168.105.2:32345/postgres?schema=public" npx prisma db pus
```

2. Create users with id being `sub` from jwt (keycloak id?)
