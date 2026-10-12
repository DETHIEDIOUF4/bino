import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../adminApi';
import { saveAdminSession } from '../adminAuthStorage';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@aidafall.ca');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await adminApi.post('/auth/login', { email, password });
      const user = data.data.user;
      if (!['admin', 'agent'].includes(user.role)) {
        setError('Accès réservé aux administrateurs et agents.');
        return;
      }
      if (user.role === 'agent' && !user.isActive) {
        setError('Compte agent désactivé.');
        return;
      }
      saveAdminSession(data.data.token, user);
      navigate(user.role === 'agent' ? '/adminbino/conducteurs' : '/adminbino/tableau-de-bord', {
        replace: true,
      });
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root admin-login">
      <div className="admin-login-card">
        <h1>adminbino</h1>
        <p className="tagline">Connexion sécurisée — validation, trajets et utilisateurs</p>
        {error && <div className="admin-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="admin-field">
            <label htmlFor="admin-email">Courriel</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="admin-btn primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
