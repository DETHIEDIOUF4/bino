import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS = {
  scheduled: 'Planifié',
  driver_en_route: 'En route',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export default function DriverTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/trips/my')
      .then(({ data }) => setTrips(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <div className="head">
        <h1>Mes trajets publiés</h1>
        <Link to="/proposer" className="btn btn-primary">
          Nouveau trajet
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="card">
          <p>Aucun trajet. <Link to="/proposer">Proposer un trajet</Link></p>
        </div>
      ) : (
        <div className="list">
          {trips.map((t) => (
            <div key={t._id} className="card row">
              <div>
                <span className="badge badge-active">{STATUS[t.status] || t.status}</span>
                <p className="route">
                  {t.departure?.label} → {t.arrival?.label}
                </p>
                <p className="meta">
                  {new Date(t.departureTime).toLocaleString('fr-CA')} · {t.availableSeats} place(s) · ~
                  {t.suggestedFare}$
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .list { display: grid; gap: 12px; }
        .route { font-weight: 600; margin: 8px 0 4px; }
        .meta { font-size: 0.85rem; color: var(--muted); }
      `}</style>
    </div>
  );
}
