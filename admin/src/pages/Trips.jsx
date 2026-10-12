import { useEffect, useState } from 'react';
import api from '../services/api';

const TRIP_STATUS = {
  scheduled: 'Planifié',
  driver_en_route: 'En route',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const emptyForm = {
  departureLabel: '',
  arrivalLabel: '',
  departureTime: '',
  availableSeats: 1,
  maxWaitMinutes: 5,
  status: 'scheduled',
  suggestedFare: 4,
};

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTrips = () => {
    setLoading(true);
    const params = filter ? { status: filter } : {};
    api
      .get('/admin/trips', { params })
      .then(({ data }) => setTrips(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrips();
  }, [filter]);

  const openEdit = (trip) => {
    setEditing(trip);
    setForm({
      departureLabel: trip.departure?.label || '',
      arrivalLabel: trip.arrival?.label || '',
      departureTime: toLocalInputValue(trip.departureTime),
      availableSeats: trip.availableSeats ?? 1,
      maxWaitMinutes: trip.maxWaitMinutes ?? 5,
      status: trip.status,
      suggestedFare: trip.suggestedFare ?? 4,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/admin/trips/${editing._id}`, {
        departure: { label: form.departureLabel },
        arrival: { label: form.arrivalLabel },
        departureTime: new Date(form.departureTime).toISOString(),
        availableSeats: Number(form.availableSeats),
        maxWaitMinutes: Number(form.maxWaitMinutes),
        status: form.status,
        suggestedFare: Number(form.suggestedFare),
      });
      closeEdit();
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (trip) => {
    if (!window.confirm(`Supprimer le trajet ${trip.departure?.label} → ${trip.arrival?.label} ?`)) {
      return;
    }
    setDeletingId(trip._id);
    try {
      await api.delete(`/admin/trips/${trip._id}`);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && trips.length === 0) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Trajets</h2>
        <p>Modifier ou supprimer les trajets publiés sur la plateforme</p>
      </div>

      <div className="toolbar">
        <label>
          Filtrer par statut
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(TRIP_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Conducteur</th>
              <th>Itinéraire</th>
              <th>Départ</th>
              <th>Places</th>
              <th>Statut</th>
              <th>Tarif suggéré</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip._id}>
                <td>
                  {trip.driver
                    ? `${trip.driver.firstName} ${trip.driver.lastName}`
                    : '—'}
                  <br />
                  <small style={{ color: 'var(--text-muted)' }}>{trip.driver?.email}</small>
                </td>
                <td>
                  {trip.departure?.label}
                  <br />→ {trip.arrival?.label}
                </td>
                <td>{new Date(trip.departureTime).toLocaleString('fr-CA')}</td>
                <td>{trip.availableSeats}</td>
                <td>
                  <span className={`badge badge-${trip.status === 'cancelled' ? 'rejected' : trip.status === 'completed' ? 'approved' : 'pending'}`}>
                    {TRIP_STATUS[trip.status] || trip.status}
                  </span>
                </td>
                <td>{trip.suggestedFare}$</td>
                <td className="actions-cell">
                  <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => openEdit(trip)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    disabled={deletingId === trip._id}
                    onClick={() => remove(trip)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Aucun trajet.</p>}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={closeEdit} role="presentation">
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>Modifier le trajet</h3>
            <p className="modal-sub">
              {editing.driver?.firstName} {editing.driver?.lastName}
            </p>
            <form onSubmit={save} className="modal-form">
              <label>
                Départ (libellé)
                <input value={form.departureLabel} onChange={(e) => setForm({ ...form, departureLabel: e.target.value })} required />
              </label>
              <label>
                Arrivée (libellé)
                <input value={form.arrivalLabel} onChange={(e) => setForm({ ...form, arrivalLabel: e.target.value })} required />
              </label>
              <label>
                Date et heure de départ
                <input
                  type="datetime-local"
                  value={form.departureTime}
                  onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                  required
                />
              </label>
              <div className="form-row">
                <label>
                  Places disponibles
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={form.availableSeats}
                    onChange={(e) => setForm({ ...form, availableSeats: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Attente max (min)
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.maxWaitMinutes}
                    onChange={(e) => setForm({ ...form, maxWaitMinutes: e.target.value })}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Statut
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(TRIP_STATUS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tarif suggéré ($)
                  <input
                    type="number"
                    min={4}
                    max={9.99}
                    step={0.01}
                    value={form.suggestedFare}
                    onChange={(e) => setForm({ ...form, suggestedFare: e.target.value })}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeEdit}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .toolbar { margin-bottom: 16px; }
        .toolbar label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; font-weight: 600; max-width: 220px; }
        .toolbar select { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border); }
        .actions-cell { display: flex; flex-wrap: wrap; gap: 8px; }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }
        .modal { width: min(480px, 100%); max-height: 90vh; overflow-y: auto; }
        .modal h3 { margin-bottom: 4px; }
        .modal-sub { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px; }
        .modal-form { display: grid; gap: 14px; }
        .modal-form label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; font-weight: 600; }
        .modal-form input, .modal-form select {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .btn-secondary {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
