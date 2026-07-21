import { formatByType } from '../ui/formatValue.js';
import { formatNumber } from '../../utils/format.js';
import './ExecutiveSummaryTable.css';

const ARROW = { up: '↑', down: '↓', flat: '=' };

function deltaLabel(row) {
  const mag = Math.abs(row.delta);
  return row.isPP ? `${formatNumber(mag, 1)} p.p.` : `${formatNumber(mag, 1)}%`;
}

function MetaBar({ target, format }) {
  // Scale so both the current fill and the target marker fit with headroom.
  const scale = Math.max(target.value, target.value * (target.ratio || 1), 1) * 1.15;
  const fillPct = Math.min(100, (target.value * target.ratio / scale) * 100);
  const markerPct = Math.min(100, (target.value / scale) * 100);
  const tone = target.ok ? 'ok' : 'over';

  return (
    <div className="exec-meta">
      <div className="exec-meta-track">
        <div className={`exec-meta-fill ${tone}`} style={{ width: `${fillPct}%` }} />
        <div className="exec-meta-marker" style={{ left: `${markerPct}%` }} title={`Meta: ${formatByType(target.value, format)}`} />
      </div>
      <div className="exec-meta-foot">
        <span className={`exec-meta-status ${tone}`}>{target.ok ? 'Dentro da meta' : 'Fora da meta'}</span>
        <span className="exec-meta-value">meta {formatByType(target.value, format)}{target.monthly ? '/mês' : ''}</span>
      </div>
    </div>
  );
}

export default function ExecutiveSummaryTable({ rows }) {
  return (
    <div className="exec-table-wrap">
      <table className="exec-table">
        <thead>
          <tr>
            <th>Indicador</th>
            <th className="num">Mês anterior</th>
            <th className="num">Mês atual</th>
            <th className="num">Variação</th>
            <th>Meta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="exec-label">{row.label}</td>
              <td className="num exec-prev">{row.previous !== null ? formatByType(row.previous, row.format) : '—'}</td>
              <td className="num exec-current">{formatByType(row.current, row.format)}</td>
              <td className="num">
                <span className={`exec-variation exec-${row.direction === 'flat' ? 'flat' : row.good ? 'good' : 'bad'}`}>
                  <span className="exec-arrow">{ARROW[row.direction]}</span>
                  {row.direction !== 'flat' && deltaLabel(row)}
                </span>
              </td>
              <td className="exec-meta-cell">
                {row.target ? <MetaBar target={row.target} format={row.format} /> : <span className="exec-no-meta">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
