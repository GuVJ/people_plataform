import { useState } from 'react';
import ManagerNode from './ManagerNode.jsx';
import './orgchart.css';

export default function AreaNode({ area }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card org-area">
      <button type="button" className="org-area-header" onClick={() => setOpen((o) => !o)}>
        <span className={`org-caret${open ? ' open' : ''}`}>▸</span>
        <span className="org-area-name">{area.name}</span>
        <span className="org-area-stats">
          <span className="badge badge-info">{area.managers.length} gestor{area.managers.length !== 1 ? 'es' : ''}</span>
          <span className="badge badge-neutral">{area.headcount} pessoas</span>
        </span>
      </button>

      {open && (
        <div className="org-area-body fade-in">
          {area.managers.map((m) => <ManagerNode key={m.id} manager={m} />)}
          {area.unassigned.length > 0 && (
            <div className="org-unassigned">
              <p className="org-empty">{area.unassigned.length} colaborador(es) sem gestor definido nesta área.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
