import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', password: '' };

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAgents = () => {
    api.get('/admin/agents')
      .then(({ data }) => setAgents(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admin/agents', form);
      setForm(emptyForm);
      setShowForm(false);
      fetchAgents();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const toggleAgent = async (id, isActive) => {
    try {
      await api.patch(`/admin/agents/${id}`, { isActive: !isActive });
      fetchAgents();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header row-between">
        <div>
          <h2>Agents validateurs</h2>
          <p>Créez des comptes pour les personnes qui valident les conducteurs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvel agent'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Créer un agent validateur</h3>
          <p className="form-hint">L'agent pourra se connecter ici et valider ou refuser les demandes conducteur.</p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleCreate} className="agent-form">
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Courriel</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Mot de passe temporaire</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Création...' : 'Créer l\'agent'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {agents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Aucun agent créé. Ajoutez un validateur pour déléguer les validations.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Courriel</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent._id}>
                  <td>{agent.firstName} {agent.lastName}</td>
                  <td>{agent.email}</td>
                  <td>{agent.phone}</td>
                  <td>
                    <span className={`badge ${agent.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                      {agent.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td>{new Date(agent.createdAt).toLocaleDateString('fr-CA')}</td>
                  <td>
                    <button
                      className={`btn ${agent.isActive ? 'btn-danger' : 'btn-primary'}`}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => toggleAgent(agent._id, agent.isActive)}
                    >
                      {agent.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
