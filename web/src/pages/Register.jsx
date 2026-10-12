import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { loadPendingBooking } from '../services/pendingBooking';
import { resolvePostAuthDestination } from '../utils/afterAuthNavigation';
import { homePathForUser } from '../utils/roles';

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pending = loadPendingBooking();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={homePathForUser(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await register(form);
      const from = location.state?.from || homePathForUser(u);
      const { path, error: bookError } = await resolvePostAuthDestination(u, from);
      if (bookError) setError(bookError);
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="auth-page container">
        <div className="card auth-card wide">
          <h1>{pending ? 'Créer un compte pour réserver' : 'Créer un compte passager'}</h1>
          {pending ? (
            <p className="info-banner">
              Votre trajet est prêt : quelques informations et nous envoyons la demande au conducteur.
            </p>
          ) : (
            <p className="muted">
              Conducteur ? <Link to="/partager-ma-voiture">Parcours Partager ma voiture</Link>
            </p>
          )}
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={submit}>
            <div className="row">
              <label>
                Prénom
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </label>
              <label>
                Nom
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </label>
            </div>
            <label>
              Courriel
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              Téléphone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </label>
            <label>
              Mot de passe (min. 8)
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Création…' : pending ? 'Créer mon compte et réserver' : 'S\'inscrire'}
            </button>
          </form>
          <p className="auth-switch">
            Déjà un compte ?{' '}
            <Link to="/connexion" state={location.state}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
      <style>{`
        .auth-page { padding: 48px 20px; display: flex; justify-content: center; }
        .auth-card.wide { width: min(520px, 100%); }
        .auth-card h1 { margin-bottom: 6px; }
        .muted { color: var(--muted); margin-bottom: 20px; }
        .info-banner {
          background: rgba(0, 214, 163, 0.12);
          color: #007a5c;
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .auth-card form { display: grid; gap: 16px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .auth-card label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; font-size: 0.85rem; }
        .auth-card input { padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; }
        .error-banner { background: #fee2e2; color: var(--error); padding: 10px 12px; border-radius: 10px; font-size: 0.9rem; }
        .auth-switch { margin-top: 20px; text-align: center; font-size: 0.9rem; }
      `}</style>
    </PublicLayout>
  );
}
