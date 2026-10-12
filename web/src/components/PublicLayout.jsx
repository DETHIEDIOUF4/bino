import { useAuth } from '../context/AuthContext';
import { isDriverRole, isPassengerRole } from '../utils/roles';
import SiteHeader from './SiteHeader';

export default function PublicLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();

  const links = [
    { to: '/', label: 'Accueil' },
    { to: '/rechercher', label: 'Rechercher' },
    { to: '/partager-ma-voiture', label: 'Partager ma voiture' },
  ];

  if (isAuthenticated) {
    if (isPassengerRole(user)) links.push({ to: '/app/mes-trajets', label: 'Mes trajets' });
    if (isDriverRole(user)) links.push({ to: '/conducteur', label: 'Conducteur' });
    if (isPassengerRole(user)) links.push({ to: '/app', label: 'Espace passager' });
  } else {
    links.push({ to: '/connexion', label: 'Connexion' });
    links.push({ to: '/inscription', label: 'Créer un compte', className: 'nav-cta' });
  }

  const trailing = isAuthenticated ? (
    <>
      {user?.firstName && <span className="hello-pill">Bonjour {user.firstName}</span>}
      <button type="button" className="nav-btn" onClick={logout}>
        Déconnexion
      </button>
    </>
  ) : null;

  return (
    <>
      <SiteHeader brandTo="/" links={links} trailing={trailing} />
      <main className="public-main">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <p>bino — covoiturage quotidien · partage des frais · Québec</p>
        </div>
      </footer>
    </>
  );
}
