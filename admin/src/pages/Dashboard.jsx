import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;

  const items = [
    { label: 'Utilisateurs', value: stats?.totalUsers ?? 0 },
    { label: 'Conducteurs validés', value: stats?.totalDrivers ?? 0 },
    { label: 'En attente de validation', value: stats?.pendingDrivers ?? 0 },
    { label: 'Agents validateurs', value: stats?.totalAgents ?? 0 },
    { label: 'Trajets totaux', value: stats?.totalTrips ?? 0 },
    { label: 'Km partagés', value: `${stats?.totalKmShared ?? 0} km` },
    { label: 'CO₂ évité', value: `${stats?.co2SavedKg ?? 0} kg` },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Tableau de bord</h2>
        <p>Vue d'ensemble de la plateforme AidaFALL</p>
      </div>
      <div className="stats-grid">
        {items.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="label">{item.label}</div>
            <div className="value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
