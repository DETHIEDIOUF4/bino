import { useEffect, useState } from 'react';
import adminApi from '../adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Utilisateurs', value: stats?.totalUsers ?? '—', hint: 'passagers & conducteurs' },
    { label: 'Conducteurs validés', value: stats?.totalDrivers ?? '—', hint: 'peuvent publier' },
    { label: 'En attente', value: stats?.pendingDrivers ?? '—', hint: 'à valider' },
    { label: 'Trajets publiés', value: stats?.totalTrips ?? '—', hint: 'tous statuts' },
    { label: 'Courses terminées', value: stats?.totalBookings ?? '—', hint: 'réservations complétées' },
    { label: 'Km partagés', value: stats?.totalKmShared != null ? `${stats.totalKmShared} km` : '—', hint: 'trajets complétés' },
    { label: 'CO₂ évité', value: stats?.co2SavedKg != null ? `${stats.co2SavedKg} kg` : '—', hint: 'estimation' },
    { label: 'Agents actifs', value: stats?.totalAgents ?? '—', hint: 'validateurs' },
  ];

  return (
    <>
      <header className="admin-page-head">
        <h1>Tableau de bord</h1>
        <p>Suivi des chiffres clés de la plateforme bino</p>
      </header>
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <div className="admin-stats">
          {cards.map((c) => (
            <div key={c.label} className="admin-stat">
              <div className="label">{c.label}</div>
              <div className="value">{c.value}</div>
              <div className="hint">{c.hint}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
