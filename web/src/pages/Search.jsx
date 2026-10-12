import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import RouteAddressForm from '../components/RouteAddressForm';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { savePendingBooking } from '../services/pendingBooking';
import { savePendingRideRequest } from '../services/pendingRideRequest';

export default function Search() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [departure, setDeparture] = useState(null);
  const [destination, setDestination] = useState(null);
  const [fare, setFare] = useState(6);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [bookingTripId, setBookingTripId] = useState(null);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [openRequestId, setOpenRequestId] = useState(null);
  const [error, setError] = useState('');

  const search = async () => {
    if (departure?.lat == null || destination?.lat == null) {
      setError('Choisissez un départ et une arrivée (suggestions, raccourcis ou liste).');
      return;
    }
    setError('');
    setSearching(true);
    setSearched(true);
    setOpenRequestId(null);
    try {
      const { data } = await api.get('/trips/search', {
        params: {
          lat: departure.lat,
          lng: departure.lng,
          destLat: destination.lat,
          destLng: destination.lng,
          date: new Date().toISOString(),
          timeFlexibility: 30,
        },
      });
      setResults(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de recherche');
      setResults([]);
    }
    setSearching(false);
  };

  const bookPayload = () => ({
    pickup: departure,
    dropoff: destination,
    requestedTime: new Date().toISOString(),
    timeFlexibilityMinutes: 30,
    fareAmount: fare,
  });

  const rideRequestPayload = () => ({
    departure,
    arrival: destination,
    requestedTime: new Date().toISOString(),
    timeFlexibilityMinutes: 30,
    fareAmount: fare,
  });

  const book = async (result) => {
    const trip = result.trip;

    if (!isAuthenticated) {
      savePendingBooking({ tripId: trip._id, ...bookPayload() });
      navigate('/inscription', { state: { from: '/rechercher', bookAfterAuth: true } });
      return;
    }

    setBookingTripId(trip._id);
    try {
      const { data } = await api.post(`/trips/${trip._id}/book`, bookPayload());
      navigate(`/app/trajet/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Réservation impossible');
    } finally {
      setBookingTripId(null);
    }
  };

  const createOpenRequest = async () => {
    if (departure?.lat == null || destination?.lat == null) return;

    if (!isAuthenticated) {
      savePendingRideRequest(rideRequestPayload());
      navigate('/inscription', { state: { from: '/rechercher', openRequest: true } });
      return;
    }

    setCreatingRequest(true);
    setError('');
    try {
      const { data } = await api.post('/ride-requests', rideRequestPayload());
      setOpenRequestId(data.data._id);
      setResults([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer la demande');
    } finally {
      setCreatingRequest(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container search-page">
        <h1>Rechercher un trajet</h1>
        <p className="lead">
          Départ par défaut à Québec. Tarif suggéré selon la distance — ajustez-le, puis lancez le matching le plus
          proche.
        </p>

        <div className="card search-form">
          <RouteAddressForm
            departure={departure}
            destination={destination}
            onDepartureChange={setDeparture}
            onDestinationChange={setDestination}
            fare={fare}
            onFareChange={setFare}
          />

          {error && <div className="error-banner">{error}</div>}

          <button type="button" className="btn btn-primary" onClick={search} disabled={searching}>
            {searching ? 'Matching…' : 'Lancer le matching'}
          </button>
        </div>

        {openRequestId && (
          <div className="card success-banner">
            <h2>Demande envoyée aux conducteurs</h2>
            <p>
              Votre trajet sera proposé aux chauffeurs. Dès qu&apos;un conducteur accepte, le trajet s&apos;ouvre au
              public jusqu&apos;à remplissage des places.
            </p>
            {isAuthenticated && (
              <Link to="/app" className="btn btn-outline">
                Voir mon espace
              </Link>
            )}
          </div>
        )}

        {searched && !searching && results.length === 0 && !openRequestId && (
          <div className="card no-match">
            <h2>Aucun trajet assez proche</h2>
            <p>
              Créez une <strong>demande ouverte</strong> : les conducteurs la verront et pourront l&apos;accepter. Le
              trajet sera ensuite visible par tous les passagers tant qu&apos;il reste des places.
            </p>
            <button type="button" className="btn btn-primary" onClick={createOpenRequest} disabled={creatingRequest}>
              {creatingRequest ? 'Envoi…' : isAuthenticated ? 'Proposer ma demande aux conducteurs' : 'Créer un compte et envoyer la demande'}
            </button>
          </div>
        )}

        <div className="results">
          {results.map((r) => {
            const trip = r.trip;
            const driver = trip.driver;
            return (
              <div key={trip._id} className="card result-card">
                <div>
                  <h3>
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <p className="muted">
                    ★ {(driver.rating ?? 0).toFixed(1)} · Match {r.matchPercent}% · ~{r.detourKm} km détour
                  </p>
                  <p>
                    {trip.departure?.label} → {trip.arrival?.label}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={bookingTripId === trip._id}
                  onClick={() => book(r)}
                >
                  {isAuthenticated ? `Réserver · ${fare.toFixed(2)}$` : 'Réserver — créer un compte'}
                </button>
              </div>
            );
          })}
        </div>

        {!isAuthenticated && results.length > 0 && (
          <p className="auth-hint">
            Déjà inscrit ? <Link to="/connexion">Connectez-vous</Link>
          </p>
        )}
      </div>

      <style>{`
        .search-page { padding: 32px 20px 48px; }
        .search-page h1 { margin-bottom: 6px; }
        .lead { color: var(--muted); margin-bottom: 20px; max-width: 680px; }
        .search-form { display: grid; gap: 20px; margin-bottom: 24px; }
        .error-banner { background: #fee2e2; color: var(--error); padding: 10px; border-radius: 10px; }
        .no-match, .success-banner { margin-bottom: 20px; }
        .no-match h2, .success-banner h2 { font-size: 1.1rem; margin-bottom: 8px; }
        .no-match p, .success-banner p { color: var(--muted); margin-bottom: 16px; line-height: 1.5; }
        .results { display: grid; gap: 12px; }
        .result-card { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .result-card h3 { margin-bottom: 4px; }
        .muted { color: var(--muted); font-size: 0.9rem; }
        .auth-hint { margin-top: 20px; font-size: 0.9rem; color: var(--muted); }
        @media (max-width: 640px) {
          .result-card { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </PublicLayout>
  );
}
