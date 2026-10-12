import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isPassengerRole } from '../utils/roles';

export default function DriverShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/conducteur" className="brand-link">
            <img src="/brand/bino-logo-compact.svg" alt="bino" className="brand-logo" />
          </Link>
          <nav className="header-nav">
            <NavLink to="/conducteur">Accueil</NavLink>
            <NavLink to="/proposer">Proposer</NavLink>
            <NavLink to="/conducteur/trajets">Mes trajets</NavLink>
            <NavLink to="/conducteur/demandes">Demandes</NavLink>
            {isPassengerRole(user) && <NavLink to="/app">Espace passager</NavLink>}
          </nav>
          <div className="header-user">
            <span>{user?.firstName}</span>
            <button type="button" className="btn-text" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="app-main container">
        <Outlet />
      </main>
      <style>{`
        .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
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
          gap: 24px;
          padding: 12px 20px;
          flex-wrap: wrap;
        }
        .brand-link { display: flex; align-items: center; text-decoration: none; }
        .brand-logo { height: 36px; }
        .header-nav { display: flex; gap: 12px; flex: 1; flex-wrap: wrap; }
        .header-nav a {
          text-decoration: none;
          color: var(--muted);
          font-weight: 600;
          font-size: 0.85rem;
          padding: 8px 10px;
          border-radius: 8px;
        }
        .header-nav a.active {
          color: var(--framboise-btn);
          background: rgba(214, 43, 76, 0.08);
        }
        .header-user {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .btn-text {
          border: none;
          background: none;
          color: var(--framboise-btn);
          font-weight: 600;
        }
        .app-main { flex: 1; padding: 28px 20px 48px; }
      `}</style>
    </div>
  );
}
