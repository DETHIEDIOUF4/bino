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
  const [comparison, setComparison] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

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
          fare,
        },
      });
      setResults(data.data);
      setComparison(data.comparison || null);
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
    paymentMethod,
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
      <div className="container page-section">
        <header className="page-head">
          <h1>Rechercher un trajet</h1>
          <p className="page-lead">
            Visiteur bienvenu : cherchez sans compte. Pour réserver :{' '}
            <Link to="/connexion">connexion passager</Link> ou <Link to="/inscription">créer un compte</Link>.
          </p>
        </header>

        <div className="card card-glow search-form-stack">
          <RouteAddressForm
            departure={departure}
            destination={destination}
            onDepartureChange={setDeparture}
            onDestinationChange={setDestination}
            fare={fare}
            onFareChange={setFare}
          />

          {error && <div className="error-banner">{error}</div>}

          <fieldset className="pay-choice">
            <legend>Paiement au moment de la réservation</legend>
            <label>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              Espèces (au conducteur)
            </label>
            <label>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              Carte (Stripe)
            </label>
          </fieldset>

          <button type="button" className="btn btn-primary btn-block" onClick={search} disabled={searching}>
            {searching ? 'Matching…' : 'Lancer le matching'}
          </button>
        </div>

        {comparison && (
          <div className="card taxi-compare">
            <h2>bino vs taxi</h2>
            <p>
              Contribution proposée : <strong>{Number(comparison.proposedFare).toFixed(2)} $</strong>
              {' · '}
              taxi estimé (~{comparison.distanceKm} km) :{' '}
              <strong>{Number(comparison.taxiEstimate).toFixed(2)} $</strong>
            </p>
            <p>
              Économie : <strong>{Number(comparison.moneySaved).toFixed(2)} $</strong>
              {' · '}
              CO₂ évité : <strong>{comparison.co2SavedKg} kg</strong>
              {' · '}
              points : <strong>{comparison.gratificationPoints}</strong>
            </p>
          </div>
        )}

        {openRequestId && (
          <div className="card success-banner" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Demande envoyée aux conducteurs</h2>
            <p className="page-lead" style={{ marginBottom: 16 }}>
              Dès qu&apos;un conducteur accepte, le trajet s&apos;ouvre au public jusqu&apos;à remplissage des places.
            </p>
            {isAuthenticated && (
              <Link to="/app" className="btn btn-outline">
                Voir mon espace
              </Link>
            )}
          </div>
        )}

        {searched && !searching && results.length === 0 && !openRequestId && (
          <div className="card" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Aucun trajet assez proche</h2>
            <p className="page-lead" style={{ marginBottom: 16 }}>
              Créez une <strong>demande ouverte</strong> : les conducteurs pourront l&apos;accepter et proposer le
              trajet à tous.
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={createOpenRequest} disabled={creatingRequest}>
              {creatingRequest
                ? 'Envoi…'
                : isAuthenticated
                  ? 'Proposer ma demande aux conducteurs'
                  : 'Créer un compte et envoyer la demande'}
            </button>
          </div>
        )}

        <div className="results-grid" style={{ marginTop: 24 }}>
          {results.map((r) => {
            const trip = r.trip;
            const driver = trip.driver;
            return (
              <div key={trip._id} className="card result-card">
                <div>
                  <span className="badge badge-match">Match {r.matchPercent}%</span>
                  <h3 style={{ marginTop: 10, marginBottom: 4 }}>
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <p className="result-meta">
                    ★ {(driver.rating ?? 0).toFixed(1)} · ~{r.detourKm} km de détour
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
                  {isAuthenticated ? `Réserver · ${fare.toFixed(2)} $` : 'Réserver — créer un compte'}
                </button>
              </div>
            );
          })}
        </div>

        {!isAuthenticated && (
          <p className="auth-switch">
            Compte passager : <Link to="/connexion">connexion</Link> · <Link to="/inscription">créer un compte</Link>
          </p>
        )}
      </div>
      <style>{`
        .pay-choice { border: none; display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.9rem; font-weight: 600; }
        .pay-choice legend { font-weight: 700; margin-bottom: 8px; }
        .pay-choice label { display: flex; align-items: center; gap: 8px; }
        .taxi-compare { margin-top: 20px; border-left: 4px solid var(--menthe); }
        .taxi-compare h2 { font-size: 1.1rem; margin-bottom: 8px; }
      `}</style>
    </PublicLayout>
  );
}
