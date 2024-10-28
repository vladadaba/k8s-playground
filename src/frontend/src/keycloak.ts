import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  clientId: "test_client_public",
  realm: "test_realm",
  url: "http://keycloak:8080",
});

export default keycloak;
