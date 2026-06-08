import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const navItems = [
  { 
    path: '/', 
    label: 'Dashboard', 
    icon: (
      <svg className="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  { 
    path: '/products', 
    label: 'Products', 
    icon: (
      <svg className="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    path: '/customers', 
    label: 'Customers', 
    icon: (
      <svg className="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    path: '/orders', 
    label: 'Orders', 
    icon: (
      <svg className="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
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
            <svg className="sidebar__logo-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="url(#logo-grad)" strokeWidth="2.5" />
              <path d="M8 8h8M8 12h5" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="logo-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="hsl(217, 91%, 60%)" />
                  <stop offset="1" stopColor="hsl(271, 91%, 65%)" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <h1 className="sidebar__title">InvenTrack</h1>
              <p className="sidebar__subtitle">Enterprise Hub</p>
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
                <span className="sidebar__link-icon-container">{item.icon}</span>
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
            System Live
          </div>
        </div>
      </nav>
    </>
  );
}
