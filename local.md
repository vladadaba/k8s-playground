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
5. Password: `S0m3P@$$w0rd`

Keycloak - http://localhost:8080/admin/master/console/
