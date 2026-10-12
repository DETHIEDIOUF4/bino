import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isPassengerRole } from '../utils/roles';
import SiteHeader from './SiteHeader';

export default function DriverShell() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/conducteur', label: 'Accueil', navLink: true, end: true },
    { to: '/proposer', label: 'Proposer', navLink: true },
    { to: '/conducteur/trajets', label: 'Mes trajets', navLink: true },
    { to: '/conducteur/demandes', label: 'Demandes', navLink: true },
  ];
  if (isPassengerRole(user)) {
    links.push({ to: '/app', label: 'Espace passager', navLink: true });
  }

  const trailing = (
    <>
      <span className="hello-pill">{user?.firstName}</span>
      <button type="button" className="nav-btn" onClick={logout}>
        Déconnexion
      </button>
    </>
  );

  return (
    <div className="app-shell">
      <SiteHeader brandTo="/conducteur" links={links} trailing={trailing} />
      <main className="app-main container">
        <Outlet />
      </main>
    </div>
  );
}
