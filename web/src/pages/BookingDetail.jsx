import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Timeline from '../components/Timeline';
import PlatformPayment from '../components/PlatformPayment';
import api, { fetchPublicTrack } from '../services/api';
import { loadTrackCache, saveTrackCache } from '../services/trackCache';

function parseTrackUrl(url) {
  if (!url) return null;
  const m = url.match(/\/suivi\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return { bookingId: m[1], token: m[2] };
}

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [track, setTrack] = useState(() => loadTrackCache(id));
  const [trackUrl, setTrackUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmingPickup, setConfirmingPickup] = useState(false);

  const refreshTrack = useCallback(async (url) => {
    const parsed = parseTrackUrl(url);
    if (!parsed) return;
    try {
      const live = await fetchPublicTrack(parsed.bookingId, parsed.token);
      setTrack(saveTrackCache(parsed.bookingId, live));
    } catch {
      const cached = loadTrackCache(parsed.bookingId);
      if (cached) setTrack(cached);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/bookings/${id}`);
      setBooking(data.data.booking);
      setTrackUrl(data.data.trackUrl || '');
      if (data.data.trackUrl) await refreshTrack(data.data.trackUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger');
    }
  }, [id, refreshTrack]);

  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, [load]);

  const confirmPickup = async () => {
    setConfirmingPickup(true);
    try {
      await api.patch(`/bookings/${id}/confirm-pickup`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Confirmation impossible');
    } finally {
      setConfirmingPickup(false);
    }
  };

  const copyLink = () => {
    if (trackUrl) {
      navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!booking) return <p>Chargement…</p>;

  const trip = booking.trip;
  const driver = trip?.driver;
  const parsed = parseTrackUrl(trackUrl);
  const publicPath = parsed ? `/suivi/${parsed.bookingId}/${parsed.token}` : null;

  return (
    <div className="booking-detail">
      <Link to="/app/mes-trajets">← Mes trajets</Link>
      <h1>Détail & suivi</h1>

      <div className="grid">
        <div className="card">
          <h2>Progression</h2>
          <Timeline steps={track?.timeline || []} />
          {track?.cachedAt && (
            <p className="cache-note">Mis à jour localement · rafraîchissement auto</p>
          )}
        </div>

        <div className="card">
          <h2>Informations</h2>
          {driver && (
            <p>
              <strong>Conducteur :</strong> {driver.firstName} {driver.lastName}
              {driver.rating ? ` · ★ ${driver.rating.toFixed(1)}` : ''}
            </p>
          )}
          <p>
            <strong>Trajet :</strong> {booking.pickup?.label} → {booking.dropoff?.label}
          </p>
          {booking.status === 'pickup_pending' && (
            <div className="pickup-confirm">
              <p>Le conducteur indique vous avoir récupéré. Confirmez pour démarrer le trajet.</p>
              <button type="button" className="btn btn-primary" disabled={confirmingPickup} onClick={confirmPickup}>
                {confirmingPickup ? '…' : 'Je confirme être à bord'}
              </button>
            </div>
          )}
          {trackUrl && (
            <div className="link-actions">
              <button type="button" className="btn btn-outline" onClick={copyLink}>
                {copied ? 'Copié !' : 'Copier le lien de suivi'}
              </button>
              {publicPath && (
                <Link to={publicPath} className="btn btn-primary">
                  Ouvrir suivi plein écran
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <PlatformPayment bookingId={id} fareAmount={booking.fareAmount} bookingStatus={booking.status} />

      <style>{`
        .booking-detail > a { display: inline-block; margin-bottom: 16px; font-weight: 600; text-decoration: none; }
        h1 { margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
        h2 { font-size: 1.1rem; margin-bottom: 16px; }
        .cache-note { margin-top: 12px; font-size: 0.8rem; color: var(--muted); }
        .link-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .pickup-confirm {
          background: rgba(0, 214, 163, 0.12);
          padding: 14px;
          border-radius: 12px;
          margin: 14px 0;
        }
        .pickup-confirm p { margin-bottom: 10px; font-size: 0.9rem; }
        .error { color: var(--error); }
      `}</style>
    </div>
  );
}
