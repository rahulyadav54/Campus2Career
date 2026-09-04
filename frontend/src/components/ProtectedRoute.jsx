import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isTokenValid } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = isTokenValid();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
