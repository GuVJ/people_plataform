import { Link } from 'react-router-dom';
import { RISK_LEVEL_COLOR } from '../../data/risk.js';
import { formatNumber } from '../../utils/format.js';
import './EmployeeCard.css';

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
}

export default function EmployeeCard({ employee: e }) {
  return (
    <Link to={`/funcionario/${e.id}`} className="chat-employee-card">
      <span className="chat-employee-avatar">{initials(e.name)}</span>
      <div className="chat-employee-info">
        <span className="chat-employee-name">{e.name}</span>
        <span className="chat-employee-role">{e.roleLevel} · {e.area}</span>
        <div className="chat-employee-badges">
          <span className="badge badge-neutral">{formatNumber(e.tenureYears, 1)} anos de casa</span>
          <span className="badge badge-neutral">Desempenho: {e.performanceBucket}</span>
          {e.risk && <span className={`badge badge-${RISK_LEVEL_COLOR[e.risk.level]}`}>Risco {e.risk.level} · {e.risk.score}/100</span>}
        </div>
      </div>
      <span className="chat-employee-cta">Ver ficha completa →</span>
    </Link>
  );
}
