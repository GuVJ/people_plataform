import { useState } from 'react';
import { Link } from 'react-router-dom';
import './orgchart.css';

export default function ManagerNode({ manager }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="org-manager">
      <button type="button" className="org-manager-header" onClick={() => setOpen((o) => !o)}>
        <span className={`org-caret${open ? ' open' : ''}`}>▸</span>
        <span className="org-avatar org-avatar-lead">{manager.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
        <span className="org-manager-info">
          <Link to={`/funcionario/${manager.id}`} className="org-manager-name" onClick={(e) => e.stopPropagation()}>{manager.name}</Link>
          <span className="org-manager-role">{manager.roleLevel}</span>
        </span>
        <span className="badge badge-neutral">{manager.reports.length} reporte{manager.reports.length !== 1 ? 's' : ''}</span>
      </button>

      {open && (
        <div className="org-reports fade-in">
          {manager.reports.length === 0 && <p className="org-empty">Nenhum reporte direto.</p>}
          {manager.reports.map((r) => (
            <Link to={`/funcionario/${r.id}`} key={r.id} className="org-report-row">
              <span className="org-avatar">{r.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
              <span>
                <span className="org-report-name">{r.name}</span>
                <span className="org-report-role">{r.roleLevel}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
