import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

export default function ShareMyCar() {
  return (
    <PublicLayout>
      <section className="hero container">
        <span className="tag">Partager ma voiture</span>
        <h1>Proposez un trajet, remplissez vos places</h1>
        <p className="lead">
          Décrivez votre itinéraire sans compte. Au moment de publier, créez votre profil conducteur — validation par
          un agent bino, puis gestion des demandes passagers sur le web.
        </p>
        <div className="actions">
          <Link to="/proposer" className="btn btn-primary">
            Proposer un trajet
          </Link>
          <Link to="/inscription-conducteur" className="btn btn-outline">
            Créer un compte conducteur
          </Link>
        </div>
      </section>

      <section className="steps container">
        <div className="step-card">
          <span>1</span>
          <h3>Définir l&apos;itinéraire</h3>
          <p>Départ, destination, horaire et places disponibles.</p>
        </div>
        <div className="step-card">
          <span>2</span>
          <h3>Profil conducteur</h3>
          <p>Permis, véhicule — compte vérifié par notre équipe.</p>
        </div>
        <div className="step-card">
          <span>3</span>
          <h3>Accepter & conduire</h3>
          <p>Demandes passagers, prise en charge et fin de trajet.</p>
        </div>
      </section>

      <style>{`
        .hero { padding: 40px 20px 24px; max-width: 720px; }
        .tag {
          display: inline-block;
          background: rgba(214, 43, 76, 0.1);
          color: var(--framboise-btn);
          font-weight: 700;
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
        }
        h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 12px; }
        .lead { color: var(--muted); margin-bottom: 24px; line-height: 1.55; }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 40px; }
        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding-bottom: 48px;
        }
        .step-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
        }
        .step-card span {
          display: inline-flex;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          background: var(--menthe);
          color: #004d3a;
          font-weight: 800;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .step-card h3 { margin-bottom: 6px; font-size: 1rem; }
        .step-card p { color: var(--muted); font-size: 0.9rem; }
      `}</style>
    </PublicLayout>
  );
}
