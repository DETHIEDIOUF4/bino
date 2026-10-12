import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { loadPendingTrip } from '../services/pendingTrip';
import { resolvePostAuthDestination } from '../utils/afterAuthNavigation';
import { isDriverRole } from '../utils/roles';

export default function RegisterDriver() {
  const { registerDriver, isAuthenticated, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingTrip = loadPendingTrip();
  const becomeDriver = Boolean(
    location.state?.becomeDriver || (isAuthenticated && user && !isDriverRole(user))
  );

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    driverLicenseNumber: '',
    vehicle: { brand: '', model: '', licensePlate: '' },
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && isDriverRole(user)) {
    return <Navigate to="/conducteur" replace />;
  }

  const submitNewDriver = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await registerDriver(form);
      const { path, error: postError } = await resolvePostAuthDestination(u, '/conducteur');
      if (postError) setError(postError);
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const submitBecomeDriver = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch('/users/me', {
        becomeDriver: true,
        driverLicenseNumber: form.driverLicenseNumber,
        vehicle: form.vehicle,
      });
      await refreshProfile();
      const { path, error: postError } = await resolvePostAuthDestination(
        { ...user, role: 'both', driverStatus: 'pending' },
        '/conducteur'
      );
      if (postError) setError(postError);
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = becomeDriver ? submitBecomeDriver : submitNewDriver;

  return (
    <PublicLayout>
      <div className="auth-page container">
        <div className="card auth-card wide">
          <Link to="/partager-ma-voiture" className="back">
            ← Partager ma voiture
          </Link>
          <h1>{becomeDriver ? 'Devenir conducteur' : 'Compte conducteur'}</h1>
          {pendingTrip ? (
            <p className="info-banner">Votre trajet est prêt : complétez votre profil pour le publier.</p>
          ) : (
            <p className="muted">Permis et véhicule — validation par un agent avant la première publication.</p>
          )}
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={onSubmit}>
            {!becomeDriver && (
              <>
                <div className="row">
                  <label>
                    Prénom
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Nom
                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                  </label>
                </div>
                <label>
                  Courriel
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Téléphone
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </label>
                <label>
                  Mot de passe (min. 8)
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={8}
                    required
                  />
                </label>
              </>
            )}
            <h2 className="section">Permis & véhicule</h2>
            <label>
              N° permis de conduire
              <input
                value={form.driverLicenseNumber}
                onChange={(e) => setForm({ ...form, driverLicenseNumber: e.target.value })}
                required
              />
            </label>
            <div className="row">
              <label>
                Marque
                <input
                  value={form.vehicle.brand}
                  onChange={(e) => setForm({ ...form, vehicle: { ...form.vehicle, brand: e.target.value } })}
                  required
                />
              </label>
              <label>
                Modèle
                <input
                  value={form.vehicle.model}
                  onChange={(e) => setForm({ ...form, vehicle: { ...form.vehicle, model: e.target.value } })}
                  required
                />
              </label>
            </div>
            <label>
              Plaque d&apos;immatriculation
              <input
                value={form.vehicle.licensePlate}
                onChange={(e) => setForm({ ...form, vehicle: { ...form.vehicle, licensePlate: e.target.value } })}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'En cours…' : pendingTrip ? 'Créer mon compte et publier' : 'Créer mon compte conducteur'}
            </button>
          </form>
          {!becomeDriver && (
            <p className="auth-switch">
              Déjà un compte ?{' '}
              <Link to="/connexion" state={{ ...location.state, from: '/conducteur' }}>
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>
      <style>{`
        .auth-page { padding: 48px 20px; display: flex; justify-content: center; }
        .auth-card.wide { width: min(520px, 100%); }
        .back { display: inline-block; margin-bottom: 12px; font-weight: 600; text-decoration: none; font-size: 0.9rem; }
        h1 { margin-bottom: 6px; }
        .section { font-size: 1rem; margin: 8px 0 4px; }
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
