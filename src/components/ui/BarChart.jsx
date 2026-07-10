import './charts.css';

const DEFAULT_COLOR = 'var(--color-primary)';

export default function BarChart({ data, valueKey = 'value', labelKey = 'label', color = DEFAULT_COLOR, formatValue = (v) => v, height = 30 }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div className="bar-chart-row" key={d[labelKey] ?? i} style={{ '--row-h': `${height}px` }}>
          <span className="bar-chart-label" title={d[labelKey]}>{d[labelKey]}</span>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill fade-in"
              style={{ width: `${(d[valueKey] / max) * 100}%`, background: d.color || color }}
            />
          </div>
          <span className="bar-chart-value">{formatValue(d[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}
