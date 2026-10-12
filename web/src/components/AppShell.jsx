import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isDriverRole } from '../utils/roles';
import SiteHeader from './SiteHeader';

export default function AppShell() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/app', label: 'Accueil', navLink: true, end: true },
    { to: '/rechercher', label: 'Rechercher', navLink: true },
    { to: '/app/mes-trajets', label: 'Mes trajets', navLink: true },
  ];
  if (isDriverRole(user)) {
    links.push({ to: '/conducteur', label: 'Conducteur', navLink: true });
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
      <SiteHeader brandTo="/app" links={links} trailing={trailing} />
      <main className="app-main container">
        <Outlet />
      </main>
    </div>
  );
}
