CREATE DATABASE keycloak;
CREATE USER keycloak WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
\c keycloak postgres
GRANT ALL ON SCHEMA public TO keycloak;
