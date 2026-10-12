import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { clearPendingTrip, fulfillPendingTrip, loadPendingTrip } from '../services/pendingTrip';

const STATUS = {
  none: { label: 'Profil incomplet', tone: 'pending' },
  pending: { label: 'En attente de validation', tone: 'pending' },
  approved: { label: 'Compte approuvé', tone: 'active' },
  rejected: { label: 'Demande refusée', tone: 'error' },
};

export default function DriverHome() {
  const { user, refreshProfile } = useAuth();
  const [publishMsg, setPublishMsg] = useState('');
  const pendingDraft = loadPendingTrip();

  const tryPublishDraft = useCallback(async () => {
    if (user?.driverStatus !== 'approved' || !loadPendingTrip()) return;
    try {
      await fulfillPendingTrip(api);
      setPublishMsg('Votre trajet en attente vient d’être publié.');
      await refreshProfile();
    } catch (err) {
      setPublishMsg(err.response?.data?.message || '');
    }
  }, [user?.driverStatus, refreshProfile]);

  useEffect(() => {
    tryPublishDraft();
  }, [tryPublishDraft]);

  const st = STATUS[user?.driverStatus] || STATUS.none;

  return (
    <div>
      <h1>Espace conducteur</h1>
      <p className="lead">Bonjour {user?.firstName} — gérez vos trajets et les demandes passagers.</p>

      <div className={`card status-banner tone-${st.tone}`}>
        <span className={`badge badge-${st.tone === 'active' ? 'active' : 'pending'}`}>{st.label}</span>
        {user?.driverStatus === 'pending' && (
          <p>Un agent bino vérifie votre permis et votre véhicule. Vous serez notifié dès approbation.</p>
        )}
        {user?.driverStatus === 'approved' && (
          <p>Vous pouvez publier des trajets et accepter des passagers.</p>
        )}
        {user?.driverStatus === 'rejected' && user?.driverRejectionReason && (
          <p>Motif : {user.driverRejectionReason}</p>
        )}
      </div>

      {pendingDraft && user?.driverStatus !== 'approved' && (
        <div className="card draft-banner">
          <h2>Trajet en brouillon</h2>
          <p>
            {pendingDraft.departure?.label} → {pendingDraft.arrival?.label}
          </p>
          <p className="muted">Publication automatique dès validation du compte.</p>
        </div>
      )}

      {publishMsg && <div className="card ok-banner">{publishMsg}</div>}

      <div className="actions">
        <Link
          to="/proposer"
          className={`btn btn-primary ${user?.driverStatus !== 'approved' ? 'disabled' : ''}`}
          onClick={(e) => {
            if (user?.driverStatus !== 'approved') e.preventDefault();
          }}
        >
          Proposer un trajet
        </Link>
        <Link to="/conducteur/demandes" className="btn btn-outline">
          Voir les demandes
        </Link>
        {pendingDraft && user?.driverStatus === 'approved' && (
          <button type="button" className="btn btn-outline" onClick={tryPublishDraft}>
            Publier le brouillon
          </button>
        )}
        {pendingDraft && user?.driverStatus !== 'approved' && (
          <button type="button" className="btn btn-outline" onClick={() => clearPendingTrip()}>
            Annuler le brouillon
          </button>
        )}
      </div>

      <style>{`
        h1 { margin-bottom: 6px; }
        .lead { color: var(--muted); margin-bottom: 20px; }
        .status-banner { margin-bottom: 16px; }
        .status-banner p { margin-top: 10px; font-size: 0.95rem; }
        .draft-banner h2 { font-size: 1rem; margin-bottom: 8px; }
        .muted { color: var(--muted); font-size: 0.9rem; }
        .ok-banner { background: rgba(0, 214, 163, 0.12); margin-bottom: 16px; font-weight: 600; }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; }
        .btn.disabled { opacity: 0.5; pointer-events: none; }
      `}</style>
    </div>
  );
}
