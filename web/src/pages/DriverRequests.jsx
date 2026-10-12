import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function DriverRequests() {
  const [bookings, setBookings] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      api.get('/bookings/driver/requests'),
      api.get('/ride-requests/open').catch(() => ({ data: { data: [] } })),
    ])
      .then(([bookingsRes, openRes]) => {
        setBookings(bookingsRes.data.data);
        setOpenRequests(openRes.data.data);
      })
      .catch(() => {
        setBookings([]);
        setOpenRequests([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const actBooking = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/bookings/${id}/${action}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action impossible');
    } finally {
      setBusyId(null);
    }
  };

  const acceptOpen = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/ride-requests/${id}/accept`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Acceptation impossible');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h1>Demandes</h1>
      <p className="lead">Demandes ouvertes passagers et réservations sur vos trajets.</p>
      {error && <div className="error-banner">{error}</div>}

      <section className="section">
        <h2>Demandes ouvertes (sans trajet existant)</h2>
        <p className="sub">
          Acceptez pour créer un trajet public — d&apos;autres passagers pourront réserver jusqu&apos;à remplissage.
        </p>
        {openRequests.length === 0 ? (
          <div className="card">
            <p>Aucune demande ouverte pour le moment.</p>
          </div>
        ) : (
          <div className="list">
            {openRequests.map((r) => (
              <div key={r._id} className="card item highlight">
                <div>
                  <span className="badge badge-pending">Ouverte</span>
                  <p className="passenger">
                    {r.passenger?.firstName} {r.passenger?.lastName}
                  </p>
                  <p className="route">
                    {r.departure?.label} → {r.arrival?.label}
                  </p>
                  <p className="meta">
                    {r.fareAmount}$ proposé · {new Date(r.requestedTime).toLocaleString('fr-CA')}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busyId === r._id}
                  onClick={() => acceptOpen(r._id)}
                >
                  Accepter et publier le trajet
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Réservations sur mes trajets</h2>
        {bookings.length === 0 ? (
          <div className="card">
            <p>Aucune réservation en attente.</p>
          </div>
        ) : (
          <div className="list">
            {bookings.map((b) => (
              <div key={b._id} className="card item">
                <div>
                  <span className="badge badge-pending">{b.status}</span>
                  <p className="passenger">
                    {b.passenger?.firstName} {b.passenger?.lastName}
                  </p>
                  <p className="route">
                    {b.pickup?.label} → {b.dropoff?.label}
                  </p>
                  <p className="meta">
                    {b.fareAmount}$ · {new Date(b.requestedTime).toLocaleString('fr-CA')}
                  </p>
                </div>
                <div className="btns">
                  {b.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === b._id}
                        onClick={() => actBooking(b._id, 'accept')}
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={busyId === b._id}
                        onClick={() => actBooking(b._id, 'reject')}
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyId === b._id}
                      onClick={() => actBooking(b._id, 'pickup')}
                    >
                    Indiquer la prise en charge
                  </button>
                )}
                {b.status === 'pickup_pending' && (
                  <span className="wait-passenger">En attente confirmation passager</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </section>

      <Link to="/conducteur/trajets" className="back-link">
        Voir mes trajets publiés →
      </Link>

      <style>{`
        h1 { margin-bottom: 6px; }
        .lead { color: var(--muted); margin-bottom: 16px; }
        .section { margin-bottom: 32px; }
        .section h2 { font-size: 1.05rem; margin-bottom: 6px; }
        .sub { color: var(--muted); font-size: 0.9rem; margin-bottom: 12px; }
        .error-banner { background: #fee2e2; color: var(--error); padding: 10px; border-radius: 10px; margin-bottom: 16px; }
        .list { display: grid; gap: 12px; }
        .item { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .highlight { border-left: 4px solid var(--menthe); }
        .passenger { font-weight: 700; margin: 8px 0 4px; }
        .route { font-weight: 600; }
        .meta { font-size: 0.85rem; color: var(--muted); margin-top: 4px; }
        .btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .wait-passenger { font-size: 0.85rem; color: var(--muted); font-weight: 600; }
        .back-link { display: inline-block; margin-top: 8px; font-weight: 600; }
      `}</style>
    </div>
  );
}
