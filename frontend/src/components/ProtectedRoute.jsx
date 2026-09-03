import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenValid } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTokenValid()) {
      navigate("/login");
    }
  }, [navigate]);

  return isTokenValid() ? children : null;
};

export default ProtectedRoute;
