import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import RouteAddressForm from '../components/RouteAddressForm';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { savePendingTrip } from '../services/pendingTrip';
import { isDriverRole } from '../utils/roles';

function buildTripPayload({ departure, arrival, departureTime, availableSeats, maxWaitMinutes }) {
  const dep = new Date(departureTime);
  const est = new Date(dep.getTime() + 45 * 60 * 1000);
  return {
    departure,
    arrival,
    departureTime: dep.toISOString(),
    estimatedArrival: est.toISOString(),
    availableSeats: Number(availableSeats),
    maxWaitMinutes: Number(maxWaitMinutes) || 5,
    isRecurring: false,
    recurringDays: [],
  };
}

export default function ProposeTrip() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshProfile } = useAuth();
  const [departure, setDeparture] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [fare, setFare] = useState(6);
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [maxWaitMinutes, setMaxWaitMinutes] = useState(5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const publish = async () => {
    if (departure?.lat == null || arrival?.lat == null || !departureTime) {
      setError('Renseignez départ, destination et date/heure de départ.');
      return;
    }

    const payload = buildTripPayload({
      departure,
      arrival,
      departureTime,
      availableSeats,
      maxWaitMinutes,
    });

    if (!isAuthenticated) {
      savePendingTrip(payload);
      navigate('/inscription-conducteur', { state: { from: '/proposer' } });
      return;
    }

    if (!isDriverRole(user)) {
      savePendingTrip(payload);
      navigate('/inscription-conducteur', {
        state: { from: '/proposer', becomeDriver: true },
      });
      return;
    }

    if (user.driverStatus !== 'approved') {
      savePendingTrip(payload);
      navigate('/conducteur');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/trips', payload);
      navigate('/conducteur/trajets');
    } catch (err) {
      setError(err.response?.data?.message || 'Publication impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container page">
        <Link to="/partager-ma-voiture">← Partager ma voiture</Link>
        <h1>Proposer un trajet</h1>
        <p className="lead">Même recherche de lieux que pour les passagers — défaut Québec.</p>

        <div className="card form">
          <RouteAddressForm
            departure={departure}
            destination={arrival}
            onDepartureChange={setDeparture}
            onDestinationChange={setArrival}
            fare={fare}
            onFareChange={setFare}
            showFareSlider={false}
          />

          <label>
            Départ prévu
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              required
            />
          </label>

          <label>
            Places disponibles
            <input
              type="number"
              min={1}
              max={7}
              value={availableSeats}
              onChange={(e) => setAvailableSeats(e.target.value)}
            />
          </label>

          <label>
            Marge d&apos;attente (minutes)
            <input
              type="number"
              min={0}
              max={30}
              value={maxWaitMinutes}
              onChange={(e) => setMaxWaitMinutes(e.target.value)}
            />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button type="button" className="btn btn-primary" onClick={publish} disabled={loading}>
            {loading
              ? 'Publication…'
              : isAuthenticated && isDriverRole(user)
                ? 'Publier le trajet'
                : 'Continuer — créer mon compte conducteur'}
          </button>
        </div>

        {isAuthenticated && user?.driverStatus === 'approved' && (
          <p className="hint">
            <button type="button" className="link-btn" onClick={() => refreshProfile()}>
              Actualiser mon statut
            </button>
          </p>
        )}
      </div>

      <style>{`
        .page { padding: 28px 20px 48px; max-width: 640px; }
        .page > a { font-weight: 600; text-decoration: none; display: inline-block; margin-bottom: 16px; }
        h1 { margin-bottom: 8px; }
        .lead { color: var(--muted); margin-bottom: 20px; }
        .form { display: grid; gap: 18px; }
        .form label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; font-size: 0.85rem; }
        .form input {
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .error-banner { background: #fee2e2; color: var(--error); padding: 10px; border-radius: 10px; }
        .hint { margin-top: 16px; font-size: 0.85rem; color: var(--muted); }
        .link-btn { border: none; background: none; color: var(--framboise-btn); font-weight: 600; cursor: pointer; }
      `}</style>
    </PublicLayout>
  );
}
