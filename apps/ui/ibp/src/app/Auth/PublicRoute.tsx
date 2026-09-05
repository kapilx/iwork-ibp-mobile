import { Navigate } from 'react-router-dom';

interface PublicRouteProps {
  children: JSX.Element;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = Boolean(sessionStorage.getItem('user'));

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PublicRoute;
