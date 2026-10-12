import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isDriverRole, isPassengerRole } from '../utils/roles';

export default function PublicLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand-link">
            <img src="/brand/bino-logo-compact.svg" alt="bino" className="brand-logo" />
          </Link>
          <nav className="header-nav">
            <Link to="/">Accueil</Link>
            <Link to="/rechercher">Rechercher</Link>
            <Link to="/partager-ma-voiture">Partager ma voiture</Link>
            {isAuthenticated ? (
              <>
                {isPassengerRole(user) && <Link to="/app/mes-trajets">Mes trajets</Link>}
                {isDriverRole(user) && <Link to="/conducteur">Conducteur</Link>}
                {isPassengerRole(user) && <Link to="/app">Espace passager</Link>}
                <button type="button" className="nav-btn" onClick={logout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/connexion">Connexion</Link>
                <Link to="/inscription" className="nav-cta">
                  Créer un compte
                </Link>
              </>
            )}
          </nav>
          {isAuthenticated && user?.firstName && (
            <span className="hello">Bonjour {user.firstName}</span>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container">
          <p>bino — covoiturage quotidien · partage des frais</p>
        </div>
      </footer>
      <style>{`
        .site-header {
          background: var(--white);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header-inner {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 20px;
          padding: 14px 20px;
        }
        .brand-link { display: flex; align-items: center; text-decoration: none; }
        .brand-logo { height: 40px; width: auto; }
        .header-nav { display: flex; flex-wrap: wrap; gap: 12px 16px; flex: 1; align-items: center; }
        .header-nav a {
          text-decoration: none;
          color: var(--encre);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .header-nav a:hover { color: var(--framboise-btn); }
        .nav-cta {
          background: var(--framboise-btn);
          color: var(--white) !important;
          padding: 8px 14px;
          border-radius: 999px;
        }
        .nav-btn {
          border: none;
          background: none;
          color: var(--framboise-btn);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .hello { font-size: 0.85rem; color: var(--muted); font-weight: 600; }
        .site-footer {
          margin-top: 48px;
          padding: 24px 0;
          text-align: center;
          color: var(--muted);
          font-size: 0.85rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </>
  );
}
