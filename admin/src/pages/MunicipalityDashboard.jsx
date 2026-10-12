import { useEffect, useState } from 'react';
import api from '../services/api';

export default function MunicipalityDashboard() {
  const [stats, setStats] = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/municipality/stats'),
      api.get('/municipality').catch(() => ({ data: { data: [] } })),
    ])
      .then(([statsRes, muniRes]) => {
        setStats(statsRes.data.data);
        setMunicipalities(muniRes.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;

  const items = [
    { label: 'Citoyens inscrits', value: stats?.totalUsers ?? 0, icon: '👥' },
    { label: 'Conducteurs actifs', value: stats?.totalDrivers ?? 0, icon: '🚗' },
    { label: 'Passagers', value: stats?.totalPassengers ?? 0, icon: '🧑‍🤝‍🧑' },
    { label: 'Trajets réalisés', value: stats?.totalBookings ?? 0, icon: '🛣️' },
    { label: 'Km partagés', value: `${stats?.totalKmShared ?? 0} km`, icon: '📍' },
    { label: 'CO₂ évité', value: `${stats?.co2SavedKg ?? 0} kg`, icon: '🌱' },
    { label: 'Économies générées', value: `${stats?.savingsGenerated ?? 0} $`, icon: '💰' },
    { label: "Taux d'utilisation", value: `${stats?.utilizationRate ?? 0}%`, icon: '📊' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard municipal B2G</h2>
        <p>Impact environnemental et économique pour les municipalités partenaires</p>
      </div>

      <div className="muni-hero">
        <div>
          <h3>{stats?.municipality?.name || 'Municipalité Démo'}</h3>
          <p>Outil clé en main pour vos citoyens</p>
        </div>
        <span className="muni-badge">B2G</span>
      </div>

      <div className="stats-grid">
        {items.map((item) => (
          <div key={item.label} className="stat-card stat-card-enhanced">
            <span className="stat-icon">{item.icon}</span>
            <div className="label">{item.label}</div>
            <div className="value">{item.value}</div>
          </div>
        ))}
      </div>

      {municipalities.length > 0 && (
        <div className="card" style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 16 }}>Municipalités partenaires</h3>
          <div className="muni-list">
            {municipalities.map((m) => (
              <div key={m._id} className="muni-item" style={{ borderLeftColor: m.primaryColor }}>
                <strong>{m.name}</strong>
                <span>{m.region}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
