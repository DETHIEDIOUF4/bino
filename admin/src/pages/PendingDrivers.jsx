import { useEffect, useState } from 'react';
import api from '../services/api';

export default function PendingDrivers({ user }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchDrivers = () => {
    setLoading(true);
    api.get('/admin/drivers/pending')
      .then(({ data }) => setDrivers(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleVerify = async (id, status, rejectionReason = '') => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/drivers/${id}/verify`, { status, rejectionReason });
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Conducteurs en attente</h2>
        <p>
          {user?.role === 'agent'
            ? 'Validez les permis et véhicules des nouveaux conducteurs'
            : 'Validez les permis et documents — délégable aux agents validateurs'}
        </p>
      </div>

      <div className="stats-inline">
        <div className="stat-pill">
          <strong>{drivers.length}</strong> en attente
        </div>
      </div>

      {drivers.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)' }}>Aucun conducteur en attente de validation.</p>
        </div>
      ) : (
        drivers.map((driver) => (
          <div key={driver._id} className="driver-card">
            <div className="driver-info">
              <div className="driver-header">
                <h3>{driver.firstName} {driver.lastName}</h3>
                <span className="badge badge-pending">En attente</span>
              </div>
              <div className="driver-meta">
                <p><strong>Courriel :</strong> {driver.email}</p>
                <p><strong>Téléphone :</strong> {driver.phone}</p>
                <p><strong>Permis :</strong> {driver.driverLicenseNumber || 'Non fourni'}</p>
                <p><strong>Rôle demandé :</strong> {driver.role}</p>
                <p><strong>Inscription :</strong> {new Date(driver.createdAt).toLocaleString('fr-CA')}</p>
              </div>
              {driver.vehicle && (
                <div className="vehicle-info">
                  <strong>Véhicule</strong>
                  <p>
                    {driver.vehicle.brand} {driver.vehicle.model} ({driver.vehicle.year})
                    · {driver.vehicle.color} · Plaque {driver.vehicle.licensePlate}
                    · {driver.vehicle.seats} places
                  </p>
                </div>
              )}
            </div>
            <div className="driver-actions">
              <button
                className="btn btn-primary"
                disabled={processingId === driver._id}
                onClick={() => handleVerify(driver._id, 'approved')}
              >
                {processingId === driver._id ? '...' : 'Valider'}
              </button>
              <button
                className="btn btn-danger"
                disabled={processingId === driver._id}
                onClick={() => {
                  const reason = prompt('Raison du refus (optionnel) :');
                  if (reason !== null) handleVerify(driver._id, 'rejected', reason);
                }}
              >
                Refuser
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
