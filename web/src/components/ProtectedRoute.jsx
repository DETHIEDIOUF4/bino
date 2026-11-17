import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { isPassengerRole } from '../utils/roles';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, refreshProfile } = useAuth();
  const location = useLocation();
  const [ready, setReady] = useState(isPassengerRole(user));

  useEffect(() => {
    if (!isAuthenticated || isPassengerRole(user)) {
      setReady(true);
      return;
    }
    let cancelled = false;
    api
      .patch('/users/me', { becomePassenger: true })
      .then(() => refreshProfile())
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, refreshProfile]);

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  if (!ready) return null;

  return children;
}
