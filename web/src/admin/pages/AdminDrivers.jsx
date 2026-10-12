import { useEffect, useState } from 'react';
import adminApi from '../adminApi';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/admin/drivers/pending')
      .then(({ data }) => setDrivers(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async (id, status, rejectionReason = '') => {
    setBusyId(id);
    try {
      await adminApi.patch(`/admin/drivers/${id}/verify`, { status, rejectionReason });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <header className="admin-page-head">
        <h1>Validation conducteurs</h1>
        <p>Approuvez ou refusez les demandes d&apos;inscription conducteur</p>
      </header>
      {loading ? (
        <p>Chargement…</p>
      ) : drivers.length === 0 ? (
        <div className="admin-card">
          <p style={{ color: 'var(--admin-muted)' }}>Aucune demande en attente.</p>
        </div>
      ) : (
        drivers.map((d) => (
          <div key={d._id} className="admin-card admin-driver-card">
            <div>
              <h3 style={{ marginBottom: 8 }}>
                {d.firstName} {d.lastName}{' '}
                <span className="admin-badge pending">En attente</span>
              </h3>
              <p>
                <strong>Courriel :</strong> {d.email}
              </p>
              <p>
                <strong>Téléphone :</strong> {d.phone}
              </p>
              <p>
                <strong>Permis :</strong> {d.driverLicenseNumber || '—'}
              </p>
              <p>
                <strong>Rôle :</strong> {d.role}
              </p>
              <p>
                <strong>Inscrit le :</strong> {new Date(d.createdAt).toLocaleString('fr-CA')}
              </p>
              {d.vehicle && (
                <p style={{ marginTop: 8, fontSize: '0.88rem', color: 'var(--admin-muted)' }}>
                  {d.vehicle.brand} {d.vehicle.model} ({d.vehicle.year}) · {d.vehicle.color} ·{' '}
                  {d.vehicle.licensePlate} · {d.vehicle.seats} places
                </p>
              )}
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="admin-btn primary"
                disabled={busyId === d._id}
                onClick={() => verify(d._id, 'approved')}
              >
                Valider
              </button>
              <button
                type="button"
                className="admin-btn danger"
                disabled={busyId === d._id}
                onClick={() => {
                  const reason = prompt('Motif du refus (optionnel) :');
                  if (reason !== null) verify(d._id, 'rejected', reason);
                }}
              >
                Refuser
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
