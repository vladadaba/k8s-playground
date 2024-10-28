import { ReactKeycloakProvider, useKeycloak } from "@react-keycloak/web";
import keycloakConfig from "./keycloak";
import AdminPanel from "./AdminPanel";
import UserPanel from "./UserPanel";

const App = () => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!keycloak.authenticated) {
    return (
      <div>
        <p>Not authenticated</p>
        <button onClick={() => keycloak.login()}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome, {keycloak?.tokenParsed?.name}</p>
      <button onClick={() => keycloak.logout()}>Logout</button>

      {keycloak?.tokenParsed?.realm_access?.roles.includes("admin") ? (
        <AdminPanel />
      ) : (
        <UserPanel />
      )}
    </div>
  );
};

const WrappedApp = () => (
  <ReactKeycloakProvider authClient={keycloakConfig}>
    <App />
  </ReactKeycloakProvider>
);

export default WrappedApp;
