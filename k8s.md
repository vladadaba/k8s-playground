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
3. Import realm
