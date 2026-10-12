import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api';
import { clearSession, getToken, getUser, saveSession } from '../services/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const u = data.data.user;
    if (['admin', 'agent'].includes(u.role)) {
      throw new Error('Utilisez le portail admin pour ce compte');
    }
    saveSession(data.data.token, u);
    setToken(data.data.token);
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', { ...payload, role: 'passenger' });
    saveSession(data.data.token, data.data.user);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const registerDriver = async (payload) => {
    const { data } = await api.post('/auth/register', {
      ...payload,
      role: 'driver',
      driverLicenseNumber: payload.driverLicenseNumber,
      vehicle: payload.vehicle,
    });
    saveSession(data.data.token, data.data.user);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data } = await api.get('/users/me');
    saveSession(token, data.data);
    setUser(data.data);
  };

  const value = useMemo(
    () => ({
      user,
      
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      registerDriver,
      logout,
      refreshProfile,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
