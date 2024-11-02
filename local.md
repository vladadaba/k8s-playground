# Startup

```
docker compose -f docker-compose-infra.yml -f docker-compose-dapr.yml pull
docker network create dapr_network
docker compose -f docker-compose-infra.yml up -d
docker compose up -d
```

# URLs

Zipkin - http://localhost:9411/

Seq - http://localhost:8191/

RabbitMQ UI management console: http://localhost:15672/  
User: `demo`
Password: `demo`

Redis UI management console:

```
docker run --rm -v redisinsight:/db -p 5540:5540 --network dapr_network redislabs/redisinsight:latest
```

1. Go to http://localhost:5540
2. Add Redis Database
3. Host: `redis`
4. Port: 6379
5. Password: `somepassword`

Keycloak - http://localhost:8080/admin/master/console/

# Debezium log trailing Keycloak

1. Postgres `wal_level` has to be logical for Debezium to work
   - start postgres with `postgress --wal_level=logical`
   - or run `ALTER SYSTEM SET wal_level = logical;` (might need to run it on specific database e.g. `keycloak` -> "Set as default") and **restart the db (stop and start `postgres` service in docker compose)**
   - run `show wal_level;` to check
   - Debezium must run with superuser, otherwise `permission denied to start WAL sender` error appears

~~RabbitMQ Dapr **Binding** only supports `classic` queue type (non-replicated). RabbitMQ Dapr **PubSub** supports `quorum` as well, but not `stream`.~~

~~UPDATE: Ran into a dead-end due to input bindings not being able to reject a message, so went with NestJS Hybrid Application approach for RabbitMQ subscribers. It supports `stream` queue.~~

UPDATE 2: It doesn't support `stream` queue. Also, not sure if it is possible to listen to multiple topics/queues. For `EventPattern`, payload has to be `{"patern": "...", "data":{...}}` (added by `emit` when using Nest's microservices client). Should look into `@golevelup/nestjs-rabbitmq`.

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
