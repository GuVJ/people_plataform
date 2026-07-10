import Sparkline from './Sparkline.jsx';
import { formatByType } from './formatValue.js';
import { formatNumber } from '../../utils/format.js';
import './KpiCard.css';

function trendMeta(delta, invertGood) {
  const isPositive = delta >= 0;
  const isGood = invertGood ? !isPositive : isPositive;
  return {
    icon: isPositive ? '↑' : '↓',
    className: delta === 0 ? 'neutral' : isGood ? 'good' : 'bad',
  };
}

function aiInterpretation(kpi) {
  const { label, delta, invertGood } = kpi;
  const { className } = trendMeta(delta, invertGood);
  const magnitude = Math.abs(delta) < 1 ? 'levemente' : Math.abs(delta) < 5 ? 'moderadamente' : 'fortemente';
  if (className === 'neutral') return `${label} manteve-se estável no período.`;
  const verb = delta >= 0 ? 'subiu' : 'caiu';
  const tone = className === 'good' ? 'um sinal positivo' : 'requer atenção';
  return `${label} ${verb} ${magnitude} frente ao período anterior — ${tone}.`;
}

export default function KpiCard({ kpi, sparklineValues, privacyMode }) {
  const { icon, className } = trendMeta(kpi.delta, kpi.invertGood);
  const deltaLabel = kpi.format === 'percent' || kpi.format === 'days' || kpi.format === 'years'
    ? `${formatNumber(Math.abs(kpi.delta), 1)} p.p.`
    : `${formatNumber(Math.abs(kpi.delta), 1)}%`;

  return (
    <div className="card card-hover kpi-card fade-in">
      <div className="kpi-card-top">
        <span className="kpi-card-label">{kpi.label}</span>
        <span className={`kpi-card-delta ${className}`}>{icon} {deltaLabel}</span>
      </div>
      <div className={`kpi-card-value${privacyMode ? ' privacy-blur' : ''}`}>{formatByType(kpi.value, kpi.format)}</div>
      <div className="kpi-card-bottom">
        <Sparkline values={sparklineValues} />
      </div>
      <p className="kpi-card-ai">
        <span className="kpi-card-ai-icon">✦</span>
        {aiInterpretation(kpi)}
      </p>
    </div>
  );
}
