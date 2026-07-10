import './charts.css';
import './YearComparisonChart.css';

// series: [{ year, label, color, values: number|null[12] }]  (null = month not reached yet)
// target: { label, values: number[12] } | null
export default function YearComparisonChart({ monthLabels, series, target, formatValue = (v) => `${Math.round(v)}`, height = 260 }) {
  const width = 640;
  const padTop = 20;
  const padBottom = 28;
  const padLeft = 58;
  const padRight = 16;
  const plotH = height - padTop - padBottom;
  const plotW = width - padLeft - padRight;
  const n = monthLabels.length;
  const stepX = plotW / (n - 1);
  const xAt = (i) => padLeft + i * stepX;

  const allValues = [
    ...series.flatMap((s) => s.values.filter((v) => v !== null && v !== undefined)),
    ...(target ? target.values.filter((v) => v !== null && v !== undefined) : []),
  ];
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 1) * 1.12;
  const range = max - min || 1;
  const yAt = (v) => padTop + plotH - ((v - min) / range) * plotH;

  function buildPath(values) {
    const pts = values.map((v, i) => (v === null || v === undefined ? null : [xAt(i), yAt(v)])).filter(Boolean);
    return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  }

  const GRID_STEPS = 4;
  const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, i) => min + (range * i) / GRID_STEPS);

  return (
    <div className="year-chart">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="line-chart-svg">
        {gridLines.map((v, i) => {
          const label = formatValue(v);
          const isDuplicate = i > 0 && label === formatValue(gridLines[i - 1]);
          return (
            <g key={`grid-${i}`}>
              <line x1={padLeft} y1={yAt(v)} x2={width - padRight} y2={yAt(v)} stroke="var(--color-border)" strokeWidth="1" strokeDasharray={v === 0 ? undefined : '3 4'} />
              {!isDuplicate && <text x={padLeft - 8} y={yAt(v)} textAnchor="end" dominantBaseline="middle" className="line-chart-axis-label">{label}</text>}
            </g>
          );
        })}

        {target && (
          <path d={buildPath(target.values)} fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.6" strokeDasharray="2 4" strokeLinecap="round" />
        )}

        {series.map((s) => {
          const pts = s.values.map((v, i) => (v === null || v === undefined ? null : [i, v])).filter(Boolean);
          const last = pts[pts.length - 1];
          const labelWidth = s.label.length * 6.4 + 12;
          return (
            <g key={s.year}>
              <path d={buildPath(s.values)} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map(([i, v]) => <circle key={i} cx={xAt(i)} cy={yAt(v)} r="2.6" fill={s.color} />)}
              {last && (
                <g>
                  <rect x={xAt(last[0]) + 7} y={Math.min(Math.max(yAt(last[1]) - 9, padTop), height - padBottom - 18)} width={labelWidth} height={16} rx="4" fill={s.color} />
                  <text x={xAt(last[0]) + 7 + labelWidth / 2} y={Math.min(Math.max(yAt(last[1]) + 2.5, padTop + 11.5), height - padBottom - 5.5)} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">{s.label}</text>
                </g>
              )}
            </g>
          );
        })}

        {monthLabels.map((m, i) => (
          <text key={`m-${i}`} x={xAt(i)} y={height - 8} textAnchor="middle" className="line-chart-axis-label">{m}</text>
        ))}
      </svg>

      <div className="chart-legend">
        {series.map((s) => (
          <div className="chart-legend-item" key={s.year}>
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
        {target && (
          <div className="chart-legend-item">
            <span className="chart-legend-swatch year-chart-target-swatch" />
            {target.label}
          </div>
        )}
      </div>
    </div>
  );
}
