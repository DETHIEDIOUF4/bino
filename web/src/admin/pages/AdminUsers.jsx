import { useEffect, useMemo, useState } from 'react';
import adminApi from '../adminApi';

const DRIVER_LABEL = {
  none: '—',
  pending: 'En attente',
  approved: 'Validé',
  rejected: 'Refusé',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    adminApi
      .get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'passenger') {
      return users.filter((u) => u.role === 'passenger' || u.role === 'both');
    }
    if (filter === 'driver') {
      return users.filter((u) => u.role === 'driver' || u.role === 'both' || u.driverStatus !== 'none');
    }
    if (filter === 'suspended') return users.filter((u) => u.isSuspended);
    return users;
  }, [users, filter]);

  const toggleSuspend = async (id, suspended) => {
    try {
      await adminApi.patch(`/admin/users/${id}/suspend`, { suspend: !suspended });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <>
      <header className="admin-page-head">
        <h1>Passagers & conducteurs</h1>
        <p>Consultez les comptes, suspendez ou réactivez un utilisateur</p>
      </header>
      <div className="admin-toolbar">
        <label>
          Filtrer
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="passenger">Passagers</option>
            <option value="driver">Conducteurs</option>
            <option value="suspended">Suspendus</option>
          </select>
        </label>
      </div>
      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Chargement…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Courriel</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Conducteur</th>
                <th>Trajets</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        u.driverStatus === 'approved'
                          ? 'approved'
                          : u.driverStatus === 'pending'
                            ? 'pending'
                            : u.driverStatus === 'rejected'
                              ? 'rejected'
                              : 'neutral'
                      }`}
                    >
                      {DRIVER_LABEL[u.driverStatus] || u.driverStatus}
                    </span>
                  </td>
                  <td>{u.tripCount ?? 0}</td>
                  <td>{u.isSuspended ? 'Suspendu' : 'Actif'}</td>
                  <td>
                    <button
                      type="button"
                      className={`admin-btn ${u.isSuspended ? 'primary' : 'danger'}`}
                      onClick={() => toggleSuspend(u._id, u.isSuspended)}
                    >
                      {u.isSuspended ? 'Réactiver' : 'Suspendre'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <p style={{ padding: 12, color: 'var(--admin-muted)' }}>Aucun utilisateur.</p>
        )}
      </div>
    </>
  );
}
