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
        <div className="hero-bg" aria-hidden />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-tag">Québec · covoiturage du quotidien</span>
            <h1>Partagez la route, pas les tracas</h1>
            <p>
              Trouvez ou proposez un trajet en quelques clics. Réservez sans compte, puis créez votre profil quand
              vous êtes prêt — frais partagés, conducteurs validés.
            </p>
            <div className="hero-actions">
              <Link to="/rechercher" className="btn btn-primary">
                Rechercher un trajet
              </Link>
              <Link to="/partager-ma-voiture" className="btn btn-outline">
                Partager ma voiture
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <strong>4–10 $</strong>
                <span>contribution typique</span>
              </div>
              <div className="hero-stat">
                <strong>100 %</strong>
                <span>web & mobile</span>
              </div>
              <div className="hero-stat">
                <strong>QC</strong>
                <span>focus Québec</span>
              </div>
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
          <p>Départ, destination et contribution — le matching vous propose les meilleurs trajets.</p>
        </div>
        <div className="step-card">
          <span>2</span>
          <h3>Réserver</h3>
          <p>Demande au conducteur, suivi en direct de l&apos;acceptation et de la prise en charge.</p>
        </div>
        <div className="step-card">
          <span>3</span>
          <h3>Rouler ensemble</h3>
          <p>Conducteurs vérifiés, paiement simple et trajets pensés pour le quotidien.</p>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <div>
            <h2>Prêt à essayer bino ?</h2>
            <p>Commencez par une recherche — aucun compte requis.</p>
          </div>
          <Link to="/rechercher" className="btn btn-primary">
            C&apos;est parti
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
