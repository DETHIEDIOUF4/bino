import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isDriverRole } from '../utils/roles';

export default function DriverRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  if (!isDriverRole(user)) {
    return <Navigate to="/partager-ma-voiture" replace />;
  }

  return children;
}
