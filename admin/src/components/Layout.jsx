import { NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout({ children, onLogout, user }) {
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🚗</span>
          <div>
            <h1>AidaFALL</h1>
            <p>{isAgent ? 'Agent validation' : 'Administration'}</p>
          </div>
        </div>

        {user && (
          <div className="sidebar-user">
            <strong>{user.firstName} {user.lastName}</strong>
            <span>{isAgent ? 'Agent validateur' : 'Administrateur'}</span>
          </div>
        )}

        <nav>
          {isAdmin && (
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Tableau de bord
            </NavLink>
          )}
          <NavLink to="/drivers/pending" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Conducteurs en attente
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/agents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Agents validateurs
              </NavLink>
              <NavLink to="/municipality" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Dashboard municipal
              </NavLink>
              <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Utilisateurs
              </NavLink>
              <NavLink to="/trips" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Trajets
              </NavLink>
            </>
          )}
        </nav>
        <button className="logout-btn" onClick={onLogout}>
          Déconnexion
        </button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
