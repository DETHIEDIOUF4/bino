import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicLayout from '../components/PublicLayout';
import { homePathForUser } from '../utils/roles';
import api from '../services/api';

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    api
      .get('/public/impact')
      .then(({ data }) => setImpact(data.data))
      .catch(() => {});
  }, []);

  if (isAuthenticated) return <Navigate to={homePathForUser(user)} replace />;

  return (
    <PublicLayout>
      <section className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-tag">Québec · covoiturage du quotidien</span>
            <h1>Partagez la route, pas les tracas</h1>
            <p>
              Visiteur : cherchez un trajet sans compte. Passager ou conducteur : chaque espace a sa propre connexion.
            </p>
          </div>
          <div className="hero-visual">
            <img src="/brand/bino-logo-principal.svg" alt="" className="hero-logo" />
          </div>
        </div>
      </section>

      <section className="container dual-entry">
        <article className="card card-glow entry-card">
          <span className="hero-tag">Chercher un trajet</span>
          <h2>Passagers</h2>
          <p>Trouvez un covoiturage. À chaque recherche, bino compare votre contribution au coût d’un taxi sur la même distance.</p>
          <div className="hero-actions">
            <Link to="/rechercher" className="btn btn-primary">
              Rechercher
            </Link>
            <Link to="/connexion" className="btn btn-outline">
              Connexion
            </Link>
            <Link to="/inscription" className="btn btn-outline">
              Créer un compte
            </Link>
          </div>
        </article>
        <article className="card card-glow entry-card">
          <span className="hero-tag">Trouver / proposer</span>
          <h2>Conducteurs</h2>
          <p>Proposez vos places. Compte validé par bino. Déjà passager ? Connectez-vous, puis devenez conducteur — même courriel.</p>
          <div className="hero-actions">
            <Link to="/partager-ma-voiture" className="btn btn-primary">
              Partager ma voiture
            </Link>
            <Link to="/connexion-conducteur" className="btn btn-outline">
              Connexion
            </Link>
            <Link to="/inscription-conducteur" className="btn btn-outline">
              Créer un compte
            </Link>
          </div>
        </article>
      </section>

      <section className="container page-section">
        <h2 className="impact-title">Impact de la communauté</h2>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>{impact?.co2SavedKg ?? '—'} kg</strong>
            <span>CO₂ évité</span>
          </div>
          <div className="hero-stat">
            <strong>{impact?.moneySaved != null ? `${impact.moneySaved} $` : '—'}</strong>
            <span>Montant économisé vs taxi</span>
          </div>
          <div className="hero-stat">
            <strong>{impact?.gratificationPoints ?? '—'}</strong>
            <span>Points bino (barème à confirmer)</span>
          </div>
        </div>
        <p className="page-lead" style={{ marginTop: 16 }}>
          Gratification : points pour les kilomètres partagés et les économies — le barème définitif reste à valider.
        </p>
      </section>

      <section className="steps container">
        <div className="step-card">
          <span>1</span>
          <h3>Rechercher</h3>
          <p>Départ, destination et contribution — comparaison taxi + matching.</p>
        </div>
        <div className="step-card">
          <span>2</span>
          <h3>Réserver</h3>
          <p>Carte (Stripe) ou espèces au conducteur, au choix du passager.</p>
        </div>
        <div className="step-card">
          <span>3</span>
          <h3>Rouler ensemble</h3>
          <p>Conducteurs vérifiés. Switch passager ↔ conducteur sur le même compte.</p>
        </div>
      </section>
      <style>{`
        .dual-entry { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-bottom: 8px; }
        @media (max-width: 768px) { .dual-entry { grid-template-columns: 1fr; } }
        .entry-card h2 { margin: 8px 0 10px; }
        .entry-card p { color: var(--muted); margin-bottom: 18px; }
        .impact-title { font-size: 1.35rem; margin-bottom: 16px; }
      `}</style>
    </PublicLayout>
  );
}
