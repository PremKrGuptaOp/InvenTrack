import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/products', label: 'Products', icon: '⬡' },
  { path: '/customers', label: 'Customers', icon: '◉' },
  { path: '/orders', label: 'Orders', icon: '◫' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="nav-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        <span className={`hamburger ${mobileOpen ? 'open' : ''}`} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="nav-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <nav className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="sidebar__logo-icon">▣</span>
            <div>
              <h1 className="sidebar__title">InvenTrack</h1>
              <p className="sidebar__subtitle">Management System</p>
            </div>
          </div>
        </div>

        <ul className="sidebar__nav">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                <span className="sidebar__link-label">{item.label}</span>
                {location.pathname === item.path && (
                  <span className="sidebar__link-indicator" />
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar__footer">
          <div className="sidebar__footer-badge">
            <span className="sidebar__footer-dot" />
            System Online
          </div>
        </div>
      </nav>
    </>
  );
}
