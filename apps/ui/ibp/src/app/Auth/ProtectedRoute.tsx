import { Navigate, Outlet, useLocation } from "react-router-dom";
import ComponentMount from "../components/ComponentMount";

export function ProtectedRoute() {
  const location = useLocation();
  const hasExistingSession = Boolean(sessionStorage.getItem("user"));

  // A CRM user landing on /hr-portal/* via iWork's RiskWatch handoff arrives
  // with a ?token= but, by definition, no pre-existing sessionStorage.user —
  // this IS their first request. Without this, isAuthenticated was false on
  // first render, this route redirected to /landing before <Outlet/> (and
  // therefore HRPortal, the only place that reads ?token= and exchanges it
  // via POST company-employee/crm-session) ever mounted — so that exchange
  // call never fired at all ("login api itself not hitting"). HRPortal
  // itself still decodes/validates the token before trusting it and the
  // backend exchange fails closed on a bad/expired one, so this doesn't
  // weaken auth for any other /hr-portal/* route — those still require a
  // real sessionStorage.user, same as before.
  const isCrmTokenHandoff =
    location.pathname.startsWith("/hr-portal") &&
    Boolean(new URLSearchParams(location.search).get("token"));
  const isAuthenticated = hasExistingSession || isCrmTokenHandoff;

  if (!isAuthenticated) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  return (
    <ComponentMount>
      <Outlet />
    </ComponentMount>
  );
}

export default ProtectedRoute;
