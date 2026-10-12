import { useEffect, useState } from 'react';
import api from '../services/api';

const statusLabel = {
  none: '—',
  pending: 'En attente',
  approved: 'Validé',
  rejected: 'Refusé',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSuspend = async (id, currentlySuspended) => {
    try {
      await api.patch(`/admin/users/${id}/suspend`, { suspend: !currentlySuspended });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Utilisateurs</h2>
        <p>Gérez les comptes de la plateforme</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Courriel</th>
              <th>Rôle</th>
              <th>Statut conducteur</th>
              <th>Trajets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`badge badge-${user.driverStatus === 'approved' ? 'approved' : user.driverStatus === 'pending' ? 'pending' : 'rejected'}`}>
                    {statusLabel[user.driverStatus] || user.driverStatus}
                  </span>
                </td>
                <td>{user.tripCount}</td>
                <td>
                  <button
                    className={`btn ${user.isSuspended ? 'btn-primary' : 'btn-danger'}`}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => toggleSuspend(user._id, user.isSuspended)}
                  >
                    {user.isSuspended ? 'Réactiver' : 'Suspendre'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
