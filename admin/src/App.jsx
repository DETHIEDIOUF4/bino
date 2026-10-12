import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PendingDrivers from './pages/PendingDrivers';
import MunicipalityDashboard from './pages/MunicipalityDashboard';
import Users from './pages/Users';
import Agents from './pages/Agents';
import Trips from './pages/Trips';
import Layout from './components/Layout';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('aidafall_user') || 'null');
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('aidafall_token'));
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const handler = () => {
      setToken(localStorage.getItem('aidafall_token'));
      setUser(getStoredUser());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('aidafall_token', newToken);
    localStorage.setItem('aidafall_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('aidafall_token');
    localStorage.removeItem('aidafall_user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user.role === 'admin';
  const isAgent = user.role === 'agent';
  const homePath = isAgent ? '/drivers/pending' : '/';

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {isAdmin && <Route path="/" element={<Dashboard />} />}
          <Route path="/drivers/pending" element={<PendingDrivers user={user} />} />
          {isAdmin && <Route path="/agents" element={<Agents />} />}
          {isAdmin && <Route path="/users" element={<Users />} />}
          {isAdmin && <Route path="/trips" element={<Trips />} />}
          {isAdmin && <Route path="/municipality" element={<MunicipalityDashboard />} />}
          <Route path="*" element={<Navigate to={homePath} replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
