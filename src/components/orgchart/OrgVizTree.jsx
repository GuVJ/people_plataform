import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/format.js';
import './OrgVizTree.css';

const REPORTS_CAP = 18;

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
}

function useToggleSet(initial = []) {
  const [set, setSet] = useState(() => new Set(initial));
  function toggle(key) {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  return [set, toggle, setSet];
}

export default function OrgVizTree({ company, areas, forceExpand = false }) {
  const [expandedAreas, toggleArea, setExpandedAreas] = useToggleSet([areas[0]?.name]);
  const [expandedManagers, toggleManager, setExpandedManagers] = useToggleSet([]);
  const [zoom, setZoom] = useState(1);

  function expandAll() {
    setExpandedAreas(new Set(areas.map((a) => a.name)));
  }
  function collapseAll() {
    setExpandedAreas(new Set());
    setExpandedManagers(new Set());
  }

  return (
    <div className="orgviz">
      <div className="orgviz-toolbar">
        <div className="orgviz-toolbar-group">
          <button type="button" className="btn btn-sm" onClick={expandAll}>Expandir tudo</button>
          <button type="button" className="btn btn-sm" onClick={collapseAll}>Recolher tudo</button>
        </div>
        <div className="orgviz-toolbar-group">
          <button type="button" className="orgviz-zoom-btn" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))} aria-label="Diminuir zoom">−</button>
          <span className="orgviz-zoom-value">{Math.round(zoom * 100)}%</span>
          <button type="button" className="orgviz-zoom-btn" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))} aria-label="Aumentar zoom">+</button>
        </div>
      </div>

      <div className="orgviz-viewport">
        <div className="orgviz-canvas" style={{ transform: `scale(${zoom})` }}>
          <ul className="orgviz-tree">
            <li>
              <div className="orgviz-node orgviz-node-company">
                <span className="orgviz-node-title">Empresa</span>
                <span className="orgviz-node-sub">{formatNumber(company.headcount)} colaboradores · {company.areaCount} diretorias</span>
              </div>

              <ul>
                {areas.map((area) => {
                  const isOpen = forceExpand || expandedAreas.has(area.name);
                  return (
                    <li key={area.name}>
                      <button
                        type="button"
                        className={`orgviz-node orgviz-node-area${isOpen ? ' open' : ''}`}
                        onClick={() => toggleArea(area.name)}
                      >
                        <span className="orgviz-node-title">{area.name}</span>
                        <span className="orgviz-node-sub">{formatNumber(area.headcount)} pessoas · {area.managers.length} gestor{area.managers.length !== 1 ? 'es' : ''}</span>
                        <span className="orgviz-caret">{isOpen ? '−' : '+'}</span>
                      </button>

                      {isOpen && (
                        <ul>
                          {area.managers.map((m) => {
                            const mOpen = forceExpand || expandedManagers.has(m.id);
                            return (
                              <li key={m.id}>
                                <div className={`orgviz-node orgviz-node-manager${mOpen ? ' open' : ''}`} onClick={() => m.reports.length > 0 && toggleManager(m.id)}>
                                  <span className="orgviz-avatar orgviz-avatar-lead">{initials(m.name)}</span>
                                  <Link to={`/funcionario/${m.id}`} className="orgviz-node-title orgviz-node-link" onClick={(e) => e.stopPropagation()}>{m.name}</Link>
                                  <span className="orgviz-node-sub">{m.roleLevel}</span>
                                  {m.reports.length > 0 && (
                                    <span className="orgviz-caret">{mOpen ? '−' : `${m.reports.length}`}</span>
                                  )}
                                </div>

                                {mOpen && (
                                  <ul>
                                    {m.reports.slice(0, REPORTS_CAP).map((r) => (
                                      <li key={r.id}>
                                        <Link to={`/funcionario/${r.id}`} className="orgviz-node orgviz-node-report">
                                          <span className="orgviz-avatar">{initials(r.name)}</span>
                                          <span className="orgviz-node-title">{r.name}</span>
                                          <span className="orgviz-node-sub">{r.roleLevel}</span>
                                        </Link>
                                      </li>
                                    ))}
                                    {m.reports.length > REPORTS_CAP && (
                                      <li>
                                        <div className="orgviz-node orgviz-node-more">
                                          +{m.reports.length - REPORTS_CAP} mais
                                        </div>
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
