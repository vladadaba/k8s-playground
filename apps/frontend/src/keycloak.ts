import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  clientId: "test_client_public",
  realm: "test_realm",
  url: "http://localhost:8080/", // TODO: nodeport
});

export default keycloak;
