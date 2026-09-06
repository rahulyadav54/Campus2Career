import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isTokenValid } from '../utils/auth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const isAuthenticated = isTokenValid();
  let role = null;
  try {
    role = JSON.parse(localStorage.getItem('user') || '{}')?.role;
  } catch {
    role = null;
  }
  const roleAllowed = !requiredRole || role === requiredRole;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!roleAllowed) {
    return <Navigate to={role ? `/${role}` : "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
