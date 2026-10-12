import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  pickup_pending: 'Confirmer prise en charge',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/bookings/my')
      .then(({ data }) => setBookings(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <h1>Mes trajets</h1>
      <p className="lead">Historique et réservations actives</p>

      {bookings.length === 0 ? (
        <div className="card">
          <p>Aucun trajet. <Link to="/rechercher">Rechercher un covoiturage</Link></p>
        </div>
      ) : (
        <div className="list">
          {bookings.map((b) => (
            <Link key={b._id} to={`/app/trajet/${b._id}`} className="card booking-row">
              <div>
                <span className={`badge badge-${b.status === 'pending' ? 'pending' : b.status === 'completed' ? 'done' : 'active'}`}>
                  {STATUS[b.status] || b.status}
                </span>
                <p className="route">{b.pickup?.label} → {b.dropoff?.label}</p>
                <p className="meta">{b.fareAmount}$ · {new Date(b.requestedTime).toLocaleString('fr-CA')}</p>
              </div>
              <span className="chev">→</span>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        h1 { margin-bottom: 6px; }
        .lead { color: var(--muted); margin-bottom: 20px; }
        .list { display: grid; gap: 12px; }
        .booking-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s;
        }
        .booking-row:hover { border-color: var(--framboise-btn); }
        .route { font-weight: 600; margin: 8px 0 4px; }
        .meta { font-size: 0.85rem; color: var(--muted); }
        .chev { color: var(--framboise-btn); font-weight: 700; }
      `}</style>
    </div>
  );
}
