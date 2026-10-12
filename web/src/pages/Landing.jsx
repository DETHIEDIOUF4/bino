import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicLayout from '../components/PublicLayout';
import { homePathForUser } from '../utils/roles';

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) return <Navigate to={homePathForUser(user)} replace />;

  return (
    <PublicLayout>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-tag">Covoiturage quotidien</span>
            <h1>Votre trajet, sur le web ou l&apos;app</h1>
            <p>
              Trouvez une opportunité de covoiturage sans compte. Lorsque vous réservez, créez un profil passager
              en quelques secondes — puis suivez l&apos;acceptation et le trajet en direct.
            </p>
            <div className="hero-actions">
              <Link to="/rechercher" className="btn btn-primary">
                Rechercher un trajet
              </Link>
              <Link to="/partager-ma-voiture" className="btn btn-outline">
                Partager ma voiture
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/brand/bino-logo-principal.svg" alt="" className="hero-logo" />
          </div>
        </div>
      </section>

      <section className="steps container">
        <div className="step-card">
          <span>1</span>
          <h3>Rechercher</h3>
          <p>Départ, destination et contribution — matching IA.</p>
        </div>
        <div className="step-card">
          <span>2</span>
          <h3>Réserver</h3>
          <p>Demande envoyée au conducteur ; statut en temps réel.</p>
        </div>
        <div className="step-card">
          <span>3</span>
          <h3>Suivre</h3>
          <p>Acceptation, prise en charge et fin — avec cache local.</p>
        </div>
      </section>

      <style>{`
        .hero {
          padding: 48px 0 32px;
          background: linear-gradient(180deg, var(--white) 0%, var(--creme) 100%);
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr; }
        }
        .hero-tag {
          display: inline-block;
          background: rgba(0, 214, 163, 0.15);
          color: #007a5c;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
        }
        .hero-copy h1 {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .hero-copy p { color: var(--muted); margin-bottom: 24px; max-width: 480px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-logo { width: 100%; max-width: 420px; margin: 0 auto; display: block; }
        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 32px 20px 48px;
        }
        @media (max-width: 768px) { .steps { grid-template-columns: 1fr; } }
        .step-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
        }
        .step-card span {
          display: inline-flex;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          background: var(--framboise-btn);
          color: white;
          border-radius: 50%;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .step-card h3 { margin-bottom: 8px; }
        .step-card p { color: var(--muted); font-size: 0.9rem; }
      `}</style>
    </PublicLayout>
  );
}
