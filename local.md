# Startup

```
docker compose -f docker-compose-infra.yml -f pull
docker network create k8s_playground_network
docker compose -f docker-compose-infra.yml up -d
docker compose up -d
```

# URLs

Keycloak - http://localhost:8080/admin/master/console/

Temporal UI - http://localhost:8082

# Debezium log trailing Keycloak

1. Postgres `wal_level` has to be logical for Debezium to work
   - start postgres with `postgress --wal_level=logical`
   - or run `ALTER SYSTEM SET wal_level = logical;` (might need to run it on specific database e.g. `keycloak` -> "Set as default") and **restart the db (stop and start `postgres` service in docker compose)**
   - run `show wal_level;` to check
   - Debezium must run with superuser, otherwise `permission denied to start WAL sender` error appears

# Keycloak Social login (Google & Github)

- https://medium.com/@elamarane90/keycloak-with-social-login-using-google-authentication-part-1-408d5eea73f6
- https://www.youtube.com/watch?v=_72InRW4bdU

1. Had to use `localhost` (in both keycloak env vars and frontend app) because Google only allows `localhost` and top level domains (so `keycloak:8080` won't work)

2. To remove "Update Account Information" screen after first login, make User attribute fields NOT required

3. To remove "Account already exists" when user uses different socials

https://keycloak.discourse.group/t/error-creating-a-user-that-already-exists-with-an-external-idp/23168

> It depends on how `your first broker` login Authentication Flow is configured. The default should challenge the user to “merge” accounts. There is also an option to automatically link the accounts.

https://wjw465150.gitbooks.io/keycloak-documentation/content/server_admin/topics/identity-broker/first-login-flow.html

Authentication > Flows > first broker login

# Traefik & Websockets

1. Had to add `127.0.0.1 myapp.localhost` to `/etc/hosts` to make it possible to connect using Postman (Chrome automatically resolves all `*.localhost` domains to loopback, but Postman apparently does not?)

# Debezium

Startup script not registering connectors (permission denied).

```
chmod 777 volumes/infra/debezium/register-connectors.sh
```

# Temporal admin tools

```
docker compose -f docker-compose-tools.yml up -d temporal-admin-tools
docker exec temporal-admin-tools tctl
# The following is an example of how to register a new namespace `test-namespace` with 1 day of retention (full docs at https://docs.temporal.io/docs/system-tools/tctl/)
tctl --ns test-namespace namespace register -rd 1
```

# Debugging Kafka

```
docker compose -f docker-compose-tools.yml up -d kafdrop
```

http://localhost:9000

# Redis UI

Redis UI management console:

```
docker compose -f docker-compose-tools.yml up -d redisinsights
```

1. Go to http://localhost:5540
2. Add Redis Database
3. Host: `redis`
4. Port: 6379
5. Password: `somepassword`
