import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

function NavItem({ item }) {
  const className = ({ isActive }) =>
    [item.className, isActive && item.navLink ? 'active' : ''].filter(Boolean).join(' ') || undefined;

  if (item.navLink) {
    return (
      <NavLink to={item.to} end={item.end} className={className} onClick={item.onNavigate}>
        {item.label}
      </NavLink>
    );
  }
  return (
    <Link to={item.to} className={item.className} onClick={item.onNavigate}>
      {item.label}
    </Link>
  );
}

export default function SiteHeader({ brandTo = '/', links = [], trailing = null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);
  const items = links.map((item) => ({ ...item, onNavigate: close }));

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to={brandTo} className="brand-link" onClick={close}>
          <img src="/brand/bino-logo-compact.svg" alt="bino" className="brand-logo" />
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`header-nav ${menuOpen ? 'is-open' : ''}`}>
          {items.map((item) => (
            <NavItem key={`${item.to}-${item.label}`} item={item} />
          ))}
          {trailing && <div className="header-trailing">{trailing}</div>}
        </nav>
      </div>
      {menuOpen && <button type="button" className="nav-backdrop" aria-label="Fermer" onClick={close} />}
    </header>
  );
}
