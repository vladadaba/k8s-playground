echo "Waiting for Kafka Connect to start listening"
hostname=$1
port=$2
url="http://${hostname}:${port}/connectors"
response_status=000
while [[ $response_status == 000 ]] ; do
  response_status="$(curl -s -o /dev/null -w %{http_code} ${url})"
  echo -e $(date) " Kafka Connect listener HTTP state: " $response_status " (waiting for 200)"
  sleep 5 
done
# nc -vz $hostname $port
echo -e "\n--\n+> Creating Keycloak Postgres source connector"

response_status=000
while [[ $response_status != 200 && $response_status != 201 ]] ; do
  response_status="$(curl -s -w %{http_code} -o /dev/null \
      -X "PUT" "${url}/keycloak-postgres-connector/config" \
      -H "Content-Type: application/json" \
      -d "@/scripts/connectors/keycloak-postgres-connector.json")"
  echo -e $(date) " Kafka Connect POST status: " $response_status " (waiting for 200 or 201)"
  sleep 5
done

echo -e "\n--\n+> Creating Inventory Postgres source connector"

response_status=000
while [[ $response_status != 200 && $response_status != 201 ]] ; do
  response_status="$(curl -s -w %{http_code} -o /dev/null \
      -X "PUT" "${url}/inventory-svc-outbox-connector/config" \
      -H "Content-Type: application/json" \
      -d "@/scripts/connectors/inventory-svc-outbox-connector.json")"
  echo -e $(date) " Kafka Connect POST status: " $response_status " (waiting for 200 or 201)"
  sleep 5
done