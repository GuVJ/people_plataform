import './charts.css';

const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)'];

export default function DonutChart({ data, size = 160, thickness = 22, centerLabel, centerValue, formatValue = (v) => `${v}` }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <div className="donut-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={thickness} />
          {data.map((d, i) => {
            const frac = d.count / total;
            const dash = frac * circumference;
            const gap = circumference - dash;
            const el = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color || PALETTE[i % PALETTE.length]}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offsetAcc}
                strokeLinecap={data.length > 1 ? 'butt' : 'round'}
              />
            );
            offsetAcc += dash;
            return el;
          })}
        </g>
        {(centerLabel || centerValue !== undefined) && (
          <g textAnchor="middle">
            <text x={size / 2} y={size / 2 - 2} className="donut-center-value">{centerValue}</text>
            <text x={size / 2} y={size / 2 + 16} className="donut-center-label">{centerLabel}</text>
          </g>
        )}
      </svg>
      <div className="chart-legend donut-legend">
        {data.map((d, i) => (
          <div className="chart-legend-item" key={d.label}>
            <span className="chart-legend-swatch" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
            {d.label} · {formatValue(d.pct)}%
          </div>
        ))}
      </div>
    </div>
  );
}
