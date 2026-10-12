import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { loadPendingBooking } from '../services/pendingBooking';
import { loadPendingTrip } from '../services/pendingTrip';
import { resolvePostAuthDestination } from '../utils/afterAuthNavigation';
import { homePathForUser } from '../utils/roles';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const pendingBooking = loadPendingBooking();
  const pendingTrip = loadPendingTrip();
  const pending = pendingBooking || pendingTrip;
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('passager.test@aidafall.ca');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={homePathForUser(user) || '/app'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      const from = location.state?.from || homePathForUser(u);
      const { path, error: bookError } = await resolvePostAuthDestination(u, from);
      if (bookError) setError(bookError);
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="auth-page container">
        <div className="card auth-card">
          <img src="/brand/bino-logo-compact.svg" alt="bino" className="auth-logo" />
          <h1>Connexion</h1>
          {pendingTrip ? (
            <p className="info-banner">Connectez-vous pour publier votre trajet conducteur.</p>
          ) : pendingBooking ? (
            <p className="info-banner">Connectez-vous pour finaliser votre réservation.</p>
          ) : (
            <p className="muted">Accédez à vos trajets et au suivi</p>
          )}
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={submit}>
            <label>
              Courriel
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Mot de passe
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? 'Connexion…'
                : pendingTrip
                  ? 'Se connecter et publier'
                  : pendingBooking
                    ? 'Se connecter et réserver'
                    : 'Se connecter'}
            </button>
          </form>
          <p className="auth-switch">
            Pas de compte ?{' '}
            {pendingTrip ? (
              <Link to="/inscription-conducteur" state={location.state}>
                Créer un compte conducteur
              </Link>
            ) : (
              <Link to="/inscription" state={location.state}>
                Créer un compte
              </Link>
            )}
          </p>
        </div>
      </div>
      <style>{`.auth-card form { display: grid; gap: 4px; } .auth-card .muted { margin-bottom: 20px; }`}</style>
    </PublicLayout>
  );
}
