import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAdminSession } from '../adminAuthStorage';

export default function AdminLayout({ user }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const logout = () => {
    clearAdminSession();
    navigate('/adminbino', { replace: true });
    window.location.reload();
  };

  return (
    <div className="admin-root admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">b</div>
          <div>
            <h2>bino admin</h2>
            <p>Plateforme covoiturage</p>
          </div>
        </div>
        {user && (
          <div className="admin-user-chip">
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            <span>{user.role === 'agent' ? 'Agent validateur' : 'Administrateur'}</span>
          </div>
        )}
        <nav className="admin-nav">
          {isAdmin && (
            <NavLink
              to="/adminbino/tableau-de-bord"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Tableau de bord
            </NavLink>
          )}
          <NavLink
            to="/adminbino/conducteurs"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Validation conducteurs
          </NavLink>
          {isAdmin && (
            <>
              <NavLink
                to="/adminbino/utilisateurs"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                Passagers & conducteurs
              </NavLink>
              <NavLink
                to="/adminbino/trajets"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                Trajets
              </NavLink>
            </>
          )}
        </nav>
        <button type="button" className="admin-logout" onClick={logout}>
          Déconnexion
        </button>
      </aside>
      <main className="admin-main">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}
