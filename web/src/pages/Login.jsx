import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { loadPendingBooking } from '../services/pendingBooking';
import { loadPendingTrip } from '../services/pendingTrip';
import { resolvePostAuthDestination } from '../utils/afterAuthNavigation';
import { homePathForUser, isDriverRole, isPassengerRole } from '../utils/roles';

export default function Login({ intent = 'passenger' }) {
  const { login, isAuthenticated, user } = useAuth();
  const pendingBooking = loadPendingBooking();
  const pendingTrip = loadPendingTrip();
  const isDriverIntent = intent === 'driver';
  const pending = isDriverIntent ? pendingTrip : pendingBooking;
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    if (isDriverIntent && !isDriverRole(user) && isPassengerRole(user)) {
      return <Navigate to="/inscription-conducteur" replace />;
    }
    return <Navigate to={homePathForUser(user) || '/app'} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      if (isDriverIntent && !isDriverRole(u) && isPassengerRole(u)) {
        navigate('/inscription-conducteur', { state: { becomeDriver: true, from: '/conducteur' } });
        return;
      }
      const defaultPath = isDriverIntent ? '/conducteur' : '/app';
      const from = location.state?.from || homePathForUser(u) || defaultPath;
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
        <div className={`card auth-card ${isDriverIntent ? 'auth-card-driver' : 'auth-card-passenger'}`}>
          <img src="/brand/bino-logo-compact.svg" alt="bino" className="auth-logo" />
          <span className="hero-tag">{isDriverIntent ? 'Espace conducteur' : 'Espace passager'}</span>
          <h1>{isDriverIntent ? 'Connexion conducteur' : 'Connexion passager'}</h1>
          {pending ? (
            <p className="info-banner">
              {isDriverIntent
                ? 'Connectez-vous pour publier votre trajet.'
                : 'Connectez-vous pour finaliser votre réservation.'}
            </p>
          ) : (
            <p className="muted">
              {isDriverIntent
                ? 'Publiez des trajets et acceptez des passagers.'
                : 'Recherchez, réservez et suivez vos trajets.'}
            </p>
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
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <p className="auth-switch">
            Pas encore de compte {isDriverIntent ? 'conducteur' : 'passager'} ?{' '}
            <Link
              to={isDriverIntent ? '/inscription-conducteur' : '/inscription'}
              state={location.state}
            >
              Créer un compte
            </Link>
          </p>
          <p className="auth-switch">
            {isDriverIntent ? (
              <>
                Vous êtes passager ? <Link to="/connexion">Connexion passager</Link>
              </>
            ) : (
              <>
                Vous conduisez ? <Link to="/connexion-conducteur">Connexion conducteur</Link>
              </>
            )}
          </p>
        </div>
      </div>
      <style>{`.auth-card form { display: grid; gap: 4px; } .auth-card .muted { margin-bottom: 20px; } .auth-card-driver { border-top: 4px solid var(--menthe); } .auth-card-passenger { border-top: 4px solid var(--framboise); }`}</style>
    </PublicLayout>
  );
}
