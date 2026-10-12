import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function pickActive(bookings) {
  const order = ['in_progress', 'pickup_pending', 'confirmed', 'pending'];
  for (const status of order) {
    const b = bookings.find((x) => x.status === status);
    if (b) return b;
  }
  return null;
}

export default function ClientHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const [openRequest, setOpenRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, requestsRes] = await Promise.all([
        api.get('/users/me/stats'),
        api.get('/bookings/my'),
        api.get('/ride-requests/my').catch(() => ({ data: { data: [] } })),
      ]);
      const open = requestsRes.data.data.find((r) => r.status === 'open');
      setOpenRequest(open || null);
      const bookings = bookingsRes.data.data.filter(
        (b) => b.status !== 'completed' && b.status !== 'cancelled'
      );
      setStats(statsRes.data.data);
      setActive(pickActive(bookings));
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const statusLabel = {
    pending: 'En attente de confirmation',
    confirmed: 'Conducteur confirmé — en route',
    pickup_pending: 'Confirmez la prise en charge',
    in_progress: 'Trajet en cours',
  };

  return (
    <div>
      <h1>Bonjour {user?.firstName} 👋</h1>
      <p className="lead">Trouvez un covoiturage ou suivez votre trajet en cours.</p>

      <Link to="/rechercher" className="btn btn-primary cta-search">
        Rechercher un trajet
      </Link>

      {openRequest && (
        <div className="card active-banner waiting">
          <div>
            <span className="badge badge-pending">Demande ouverte</span>
            <p>
              {openRequest.departure?.label} → {openRequest.arrival?.label}
            </p>
            <p className="wait-msg">En attente qu&apos;un conducteur accepte — le trajet sera alors public.</p>
          </div>
        </div>
      )}

      {active && (
        <div className="card active-banner">
          <div>
            <span className="badge badge-active">{statusLabel[active.status] || active.status}</span>
            <p>
              {active.pickup?.label} → {active.dropoff?.label}
            </p>
          </div>
          <Link to={`/app/trajet/${active._id}`} className="btn btn-outline">
            Voir le suivi
          </Link>
        </div>
      )}

      {!loading && stats && (
        <div className="stats-row">
          <div className="stat-mini">
            <strong>{stats.tripCount ?? 0}</strong>
            <span>Trajets</span>
          </div>
          <div className="stat-mini">
            <strong>{(stats.rating ?? 0).toFixed(1)}</strong>
            <span>Note</span>
          </div>
          <div className="stat-mini">
            <strong>{stats.co2SavedKg ?? 0} kg</strong>
            <span>CO₂ évité</span>
          </div>
        </div>
      )}

      <style>{`
        h1 { font-size: 1.75rem; margin-bottom: 8px; }
        .lead { color: var(--muted); margin-bottom: 24px; }
        .cta-search { margin-bottom: 24px; display: inline-flex; }
        .active-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          border-left: 4px solid var(--menthe);
        }
        .active-banner p { margin-top: 8px; font-weight: 600; font-size: 0.95rem; }
        .waiting { border-left-color: var(--soleil); }
        .wait-msg { font-weight: 500 !important; font-size: 0.85rem !important; color: var(--muted); }
        .stats-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .stat-mini {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          min-width: 120px;
        }
        .stat-mini strong { display: block; font-size: 1.4rem; color: var(--framboise-btn); }
        .stat-mini span { font-size: 0.8rem; color: var(--muted); }
      `}</style>
    </div>
  );
}
