import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import Timeline from '../components/Timeline';
import { fetchPublicTrack } from '../services/api';
import { loadTrackCache, saveTrackCache } from '../services/trackCache';

const STATUS_LABEL = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export default function Track() {
  const { bookingId, token } = useParams();
  const [data, setData] = useState(() => loadTrackCache(bookingId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const live = await fetchPublicTrack(bookingId, token);
      const cached = saveTrackCache(bookingId, live);
      setData(cached);
      setError('');
      setLastRefresh(new Date());
    } catch (err) {
      const cached = loadTrackCache(bookingId);
      if (cached) {
        setData(cached);
        setError('offline');
      } else {
        setError(err.response?.data?.message || 'Impossible de charger le suivi');
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const mapUrl = data?.lastLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        data.lastLocation.lng - 0.02
      },${data.lastLocation.lat - 0.02},${data.lastLocation.lng + 0.02},${
        data.lastLocation.lat + 0.02
      }&layer=mapnik&marker=${data.lastLocation.lat},${data.lastLocation.lng}`
    : data?.pickup
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${data.pickup.lng - 0.02},${
          data.pickup.lat - 0.02
        },${data.pickup.lng + 0.02},${data.pickup.lat + 0.02}&layer=mapnik&marker=${data.pickup.lat},${
          data.pickup.lng
        }`
      : null;

  return (
    <PublicLayout>
      <div className="container track-page">
        <Link to="/" className="back-link">
          ← Accueil
        </Link>

        {loading && !data && <p className="loading">Chargement du suivi…</p>}
        {error && !data && (
          <div className="card error-card">
            <p>{error}</p>
            <Link to="/">Retour à l&apos;accueil</Link>
          </div>
        )}

        {data && (
          <>
            <div className="track-header">
              <div>
                <h1>Suivi de votre trajet</h1>
                <p className="muted">
                  {data.pickup?.label} → {data.dropoff?.label}
                </p>
              </div>
              <span className={`badge badge-${data.status === 'completed' ? 'done' : data.status === 'pending' ? 'pending' : 'active'}`}>
                {STATUS_LABEL[data.status] || data.status}
              </span>
            </div>

            {error === 'offline' && (
              <p className="offline-hint">Hors ligne — affichage de la dernière mise à jour en cache.</p>
            )}

            <div className="track-grid">
              <div className="card">
                <h2>Étapes</h2>
                <Timeline steps={data.timeline} />
                {data.cachedAt && (
                  <p className="cache-note">
                    Dernière sync :{' '}
                    {lastRefresh
                      ? lastRefresh.toLocaleTimeString('fr-CA')
                      : new Date(data.cachedAt).toLocaleTimeString('fr-CA')}
                    · données conservées sur cet appareil
                  </p>
                )}
              </div>

              <div className="card">
                <h2>Détails</h2>
                {data.driver && (
                  <p>
                    <strong>Conducteur :</strong> {data.driver.firstName}
                    {data.driver.rating ? ` · ★ ${data.driver.rating.toFixed(1)}` : ''}
                  </p>
                )}
                {data.driver?.vehicle && (
                  <p>
                    <strong>Véhicule :</strong> {data.driver.vehicle}
                  </p>
                )}
                <p>
                  <strong>Contribution :</strong> {data.fareAmount} $
                </p>
                {data.requestedTime && (
                  <p>
                    <strong>Heure :</strong>{' '}
                    {new Date(data.requestedTime).toLocaleString('fr-CA')}
                  </p>
                )}
                {mapUrl && (
                  <div className="map-wrap">
                    <iframe title="Carte" src={mapUrl} loading="lazy" />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .track-page { padding: 32px 20px 48px; }
        .back-link {
          display: inline-block;
          margin-bottom: 20px;
          text-decoration: none;
          font-weight: 600;
        }
        .loading { color: var(--muted); }
        .error-card { color: var(--error); }
        .track-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }
        .track-header h1 { font-size: 1.75rem; margin-bottom: 6px; }
        .track-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 900px) {
          .track-grid { grid-template-columns: 1fr; }
        }
        .track-grid h2 {
          font-size: 1.1rem;
          margin-bottom: 16px;
        }
        .track-grid p {
          margin-bottom: 10px;
          font-size: 0.95rem;
        }
        .cache-note {
          margin-top: 16px;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .offline-hint {
          background: #fff4cc;
          color: #8a6500;
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }
        .map-wrap {
          margin-top: 16px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border);
          height: 220px;
        }
        .map-wrap iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }
      `}</style>
    </PublicLayout>
  );
}
