import { useEffect, useState } from 'react';
import adminApi from '../adminApi';

const STATUS_LABEL = {
  scheduled: 'Planifié',
  driver_en_route: 'En route',
  pickup_pending: 'Prise en charge',
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

export default function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    adminApi
      .get('/admin/trips', { params })
      .then(({ data }) => setTrips(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

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

  const save = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.patch(`/admin/trips/${editing._id}`, {
        departure: { label: form.departureLabel },
        arrival: { label: form.arrivalLabel },
        departureTime: new Date(form.departureTime).toISOString(),
        availableSeats: Number(form.availableSeats),
        maxWaitMinutes: Number(form.maxWaitMinutes),
        status: form.status,
        suggestedFare: Number(form.suggestedFare),
      });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (trip) => {
    if (!window.confirm(`Supprimer ${trip.departure?.label} → ${trip.arrival?.label} ?`)) return;
    setDeletingId(trip._id);
    try {
      await adminApi.delete(`/admin/trips/${trip._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setDeletingId(null);
    }
  };

  const completedCount = trips.filter((t) => t.status === 'completed').length;

  return (
    <>
      <header className="admin-page-head">
        <h1>Trajets</h1>
        <p>Trajets publiés par les conducteurs — modifier, annuler ou supprimer</p>
      </header>
      <div className="admin-toolbar">
        <label>
          Statut
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {!statusFilter && !loading && (
          <span className="admin-badge approved" style={{ alignSelf: 'center' }}>
            {completedCount} terminé(s) affiché(s)
          </span>
        )}
      </div>
      <div className="admin-card admin-table-wrap">
        {loading && trips.length === 0 ? (
          <p>Chargement…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Conducteur</th>
                <th>Itinéraire</th>
                <th>Départ</th>
                <th>Places</th>
                <th>Statut</th>
                <th>Tarif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip._id}>
                  <td>
                    {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : '—'}
                    <br />
                    <small style={{ color: 'var(--admin-muted)' }}>{trip.driver?.email}</small>
                  </td>
                  <td>
                    {trip.departure?.label}
                    <br />→ {trip.arrival?.label}
                  </td>
                  <td>{new Date(trip.departureTime).toLocaleString('fr-CA')}</td>
                  <td>{trip.availableSeats}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        trip.status === 'completed'
                          ? 'approved'
                          : trip.status === 'cancelled'
                            ? 'rejected'
                            : 'pending'
                      }`}
                    >
                      {STATUS_LABEL[trip.status] || trip.status}
                    </span>
                  </td>
                  <td>{trip.suggestedFare}$</td>
                  <td className="admin-actions">
                    <button type="button" className="admin-btn ghost" onClick={() => openEdit(trip)}>
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="admin-btn danger"
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
        )}
        {!loading && trips.length === 0 && (
          <p style={{ padding: 12, color: 'var(--admin-muted)' }}>Aucun trajet.</p>
        )}
      </div>

      {editing && (
        <div className="admin-modal-backdrop" onClick={() => setEditing(null)} role="presentation">
          <div className="admin-card admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Modifier le trajet</h3>
            <p style={{ color: 'var(--admin-muted)', marginBottom: 16 }}>
              {editing.driver?.firstName} {editing.driver?.lastName}
            </p>
            <form onSubmit={save}>
              <div className="admin-field">
                <label>Départ</label>
                <input
                  value={form.departureLabel}
                  onChange={(e) => setForm({ ...form, departureLabel: e.target.value })}
                  required
                />
              </div>
              <div className="admin-field">
                <label>Arrivée</label>
                <input
                  value={form.arrivalLabel}
                  onChange={(e) => setForm({ ...form, arrivalLabel: e.target.value })}
                  required
                />
              </div>
              <div className="admin-field">
                <label>Date et heure</label>
                <input
                  type="datetime-local"
                  value={form.departureTime}
                  onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-row">
                <div className="admin-field">
                  <label>Places</label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={form.availableSeats}
                    onChange={(e) => setForm({ ...form, availableSeats: e.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>Attente (min)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.maxWaitMinutes}
                    onChange={(e) => setForm({ ...form, maxWaitMinutes: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-field">
                  <label>Statut</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>Tarif ($)</label>
                  <input
                    type="number"
                    min={4}
                    max={9.99}
                    step={0.01}
                    value={form.suggestedFare}
                    onChange={(e) => setForm({ ...form, suggestedFare: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="admin-btn ghost" onClick={() => setEditing(null)}>
                  Annuler
                </button>
                <button type="submit" className="admin-btn primary" disabled={saving}>
                  {saving ? '…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
