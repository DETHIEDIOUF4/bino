import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

export default function ShareMyCar() {
  return (
    <PublicLayout>
      <section className="container subpage-hero page-head">
        <span className="hero-tag">Partager ma voiture</span>
        <h1>Proposez un trajet, remplissez vos places</h1>
        <p className="page-lead">
          Décrivez votre itinéraire sans compte. Au moment de publier, créez votre profil conducteur — validation par
          bino, puis gestion des demandes passagers.
        </p>
        <div className="subpage-actions">
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
    </PublicLayout>
  );
}
