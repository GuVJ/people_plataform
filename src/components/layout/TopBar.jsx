import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './TopBar.css';

const DASHBOARD_LINKS = [
  { to: '/workforce', label: 'Workforce' },
  { to: '/turnover', label: 'Turnover' },
  { to: '/recruitment', label: 'Recrutamento' },
  { to: '/absenteeism', label: 'Absenteísmo' },
  { to: '/overtime', label: 'Horas Extras' },
  { to: '/diversity', label: 'Diversidade' },
  { to: '/training', label: 'Treinamentos' },
  { to: '/performance', label: 'Desempenho' },
];

const PRIMARY_LINKS = [
  { to: '/organograma', label: 'Organograma' },
  { to: '/gestor', label: 'Visão do Gestor' },
  { to: '/copilot', label: 'Copiloto IA' },
  { to: '/predictions', label: 'Preditivo' },
  { to: '/planning', label: 'Planejamento' },
  { to: '/orcamento', label: 'Orçamento' },
  { to: '/benchmark', label: 'Benchmark' },
  { to: '/reports', label: 'Relatórios' },
  { to: '/funcionarios', label: 'Funcionários' },
  { to: '/dados', label: 'Dados' },
];

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconEye({ off }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function TopBar() {
  const { theme, toggleTheme, privacyMode, togglePrivacy } = usePreferences();
  const { user, roleId, setRoleId, roles } = useAuth();
  const [dashboardsOpen, setDashboardsOpen] = useState(false);
  const [dashMenuPos, setDashMenuPos] = useState(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dashRef = useRef(null);
  const dashBtnRef = useRef(null);
  const roleRef = useRef(null);
  useClickOutside(dashRef, () => setDashboardsOpen(false));
  useClickOutside(roleRef, () => setRoleMenuOpen(false));

  // The nav scrolls horizontally (overflow-x: auto), which forces overflow-y to auto too and
  // would clip an absolutely-positioned dropdown. Render the menu as position: fixed, anchored
  // to the button's on-screen rect, so it escapes the nav's clipping.
  function toggleDashboards() {
    setDashboardsOpen((open) => {
      if (!open && dashBtnRef.current) {
        const r = dashBtnRef.current.getBoundingClientRect();
        setDashMenuPos({ left: r.left, top: r.bottom + 8 });
      }
      return !open;
    });
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="topbar-brand">
          <span className="topbar-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="topbar-brand-text">
            People Analytics <strong>Copilot</strong>
          </span>
        </NavLink>

        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
            Overview
          </NavLink>

          <div className="topbar-dropdown" ref={dashRef}>
            <button
              ref={dashBtnRef}
              type="button"
              className={`topbar-link topbar-link-btn${dashboardsOpen ? ' active' : ''}`}
              onClick={toggleDashboards}
            >
              Dashboards
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {dashboardsOpen && dashMenuPos && (
              <div className="topbar-dropdown-menu topbar-dropdown-menu-fixed fade-in" style={{ left: dashMenuPos.left, top: dashMenuPos.top }}>
                {DASHBOARD_LINKS.map((link) => (
                  <NavLink key={link.to} to={link.to} className="topbar-dropdown-item" onClick={() => setDashboardsOpen(false)}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <button type="button" className="topbar-icon-btn" title="Modo privacidade" aria-label="Alternar modo privacidade" onClick={togglePrivacy} data-active={privacyMode}>
            <IconEye off={privacyMode} />
          </button>
          <button type="button" className="topbar-icon-btn" title="Alternar tema" aria-label="Alternar tema" onClick={toggleTheme}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          <div className="topbar-dropdown" ref={roleRef}>
            <button type="button" className="topbar-role-badge" onClick={() => setRoleMenuOpen((o) => !o)}>
              {user.role.label}
            </button>
            {roleMenuOpen && (
              <div className="topbar-dropdown-menu topbar-dropdown-menu-right fade-in">
                <div className="topbar-dropdown-label">Visualizar como</div>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`topbar-dropdown-item topbar-dropdown-item-btn${r.id === roleId ? ' active' : ''}`}
                    onClick={() => { setRoleId(r.id); setRoleMenuOpen(false); }}
                  >
                    <span>{r.label}</span>
                    <span className="topbar-dropdown-desc">{r.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-avatar" title={user.name}>{user.initials}</div>

          <button type="button" className="topbar-mobile-toggle" aria-label="Abrir menu" onClick={() => setMobileMenuOpen((o) => !o)}>
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="topbar-mobile-menu fade-in">
          <NavLink to="/" end className="topbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>Overview</NavLink>
          <div className="topbar-mobile-section">Dashboards</div>
          {DASHBOARD_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="topbar-mobile-link topbar-mobile-link-sub" onClick={() => setMobileMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <div className="topbar-mobile-section">Ferramentas</div>
          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="topbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
