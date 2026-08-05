import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './TopBar.css';

const DASHBOARD_LINKS = [
  { to: '/workforce', label: 'Workforce' },
  { to: '/turnover', label: 'Turnover' },
  { to: '/recruitment', label: 'Recrutamento' },
  { to: '/absenteeism', label: 'Absenteísmo' },
  { to: '/overtime', label: 'Horas Extras' },
  { to: '/atestados', label: 'Atestados' },
  { to: '/aso', label: 'ASO / Exames' },
  { to: '/seguranca', label: 'Segurança do Trabalho' },
  { to: '/epi', label: 'Gestão de EPI' },
  { to: '/nrs', label: 'Treinamentos de NRs' },
  { to: '/diversity', label: 'Diversidade' },
  { to: '/pcd', label: 'PCD · Cota' },
  { to: '/aprendizes', label: 'Jovem Aprendiz' },
  { to: '/disciplinar', label: 'Medidas Disciplinares' },
  { to: '/chamados', label: 'Chamados de RH' },
  { to: '/trabalhista', label: 'Trabalhista' },
  { to: '/posicionamento', label: 'Posicionamento Salarial' },
  { to: '/training', label: 'Treinamentos' },
  { to: '/performance', label: 'Desempenho' },
];

const PRIMARY_LINKS = [
  { to: '/organograma', label: 'Organograma' },
  { to: '/gestor', label: 'Visão do Gestor' },
  { to: '/copilot', label: 'Íris IA' },
  { to: '/planning', label: 'Planejamento' },
  { to: '/orcamento', label: 'Orçamento' },
  { to: '/gatilhos', label: 'Gatilhos' },
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

export default function TopBar() {
  const [dashboardsOpen, setDashboardsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dashRef = useRef(null);
  useClickOutside(dashRef, () => setDashboardsOpen(false));

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
            People Analytics <strong>Plataform</strong>
          </span>
        </NavLink>

        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
            Overview
          </NavLink>
          <NavLink to="/meu-painel" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
            Meu Painel
          </NavLink>

          <div className="topbar-dropdown" ref={dashRef}>
            <button
              type="button"
              className={`topbar-link topbar-link-btn${dashboardsOpen ? ' active' : ''}`}
              onClick={() => setDashboardsOpen((o) => !o)}
            >
              Dashboards
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {dashboardsOpen && (
              <div className="topbar-dropdown-menu fade-in">
                {DASHBOARD_LINKS.map((link) => (
                  <NavLink key={link.to} to={link.to} className={({ isActive }) => `topbar-dropdown-item${isActive ? ' active' : ''}`} onClick={() => setDashboardsOpen(false)}>
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
          <NavLink to="/configuracoes" className="topbar-icon-btn" title="Configurações" aria-label="Configurações">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </NavLink>

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
          <NavLink to="/meu-painel" className="topbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>Meu Painel</NavLink>
          <NavLink to="/configuracoes" className="topbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>Configurações</NavLink>
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
