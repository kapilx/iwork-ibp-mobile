import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import Header from "../components/Header";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isSessionValid = Boolean(sessionStorage.getItem('user'));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // If user is not authenticated OR session is not valid, redirect to login
  if (!user || !isSessionValid) {  
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Header />;
}
