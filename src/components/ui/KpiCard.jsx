import Sparkline from './Sparkline.jsx';
import { formatByType } from './formatValue.js';
import { formatNumber } from '../../utils/format.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import './KpiCard.css';

function trendMeta(delta, invertGood) {
  const isPositive = delta >= 0;
  const isGood = invertGood ? !isPositive : isPositive;
  return {
    icon: isPositive ? '↑' : '↓',
    className: delta === 0 ? 'neutral' : isGood ? 'good' : 'bad',
  };
}

function aiInterpretation(kpi, label, lang) {
  const { delta, invertGood } = kpi;
  const { className } = trendMeta(delta, invertGood);
  if (lang === 'en') {
    if (className === 'neutral') return `${label} stayed stable in the period.`;
    const magnitude = Math.abs(delta) < 1 ? 'slightly' : Math.abs(delta) < 5 ? 'moderately' : 'sharply';
    const verb = delta >= 0 ? 'rose' : 'fell';
    const tone = className === 'good' ? 'a positive signal' : 'needs attention';
    return `${label} ${verb} ${magnitude} vs. the prior period — ${tone}.`;
  }
  const magnitude = Math.abs(delta) < 1 ? 'levemente' : Math.abs(delta) < 5 ? 'moderadamente' : 'fortemente';
  if (className === 'neutral') return `${label} manteve-se estável no período.`;
  const verb = delta >= 0 ? 'subiu' : 'caiu';
  const tone = className === 'good' ? 'um sinal positivo' : 'requer atenção';
  return `${label} ${verb} ${magnitude} frente ao período anterior — ${tone}.`;
}

export default function KpiCard({ kpi, sparklineValues, privacyMode }) {
  const { lang, tIndicator } = useLang();
  const label = tIndicator(kpi.key, kpi.label);
  const { icon, className } = trendMeta(kpi.delta, kpi.invertGood);
  const ppUnit = lang === 'en' ? 'pp' : 'p.p.';
  const deltaLabel = kpi.format === 'percent' || kpi.format === 'days' || kpi.format === 'years'
    ? `${formatNumber(Math.abs(kpi.delta), 1)} ${ppUnit}`
    : `${formatNumber(Math.abs(kpi.delta), 1)}%`;

  return (
    <div className="card card-hover kpi-card fade-in">
      <div className="kpi-card-top">
        <span className="kpi-card-label">{label}</span>
        <span className={`kpi-card-delta ${className}`}>{icon} {deltaLabel}</span>
      </div>
      <div className={`kpi-card-value${privacyMode ? ' privacy-blur' : ''}`}>{formatByType(kpi.value, kpi.format, lang)}</div>
      <div className="kpi-card-bottom">
        <Sparkline values={sparklineValues} />
      </div>
      <p className="kpi-card-ai">
        <span className="kpi-card-ai-icon">✦</span>
        {aiInterpretation(kpi, label, lang)}
      </p>
    </div>
  );
}
