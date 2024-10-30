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
