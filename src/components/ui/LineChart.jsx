import './charts.css';

export default function LineChart({ history, forecast = [], color = 'var(--color-primary)', height = 220, formatValue = (v) => `${Math.round(v)}` }) {
  const width = 640;
  const padTop = 20;
  const padBottom = 26;
  const padLeft = 52;
  const padRight = 12;
  const plotH = height - padTop - padBottom;
  const plotW = width - padLeft - padRight;

  const allPoints = [...history.map((h) => ({ ...h, kind: 'history' })), ...forecast.map((f) => ({ ...f, kind: 'forecast' }))];
  const values = [...history.map((h) => h.y), ...forecast.flatMap((f) => [f.low, f.high, f.y])];
  const min = Math.min(...values, 0);
  const max = Math.max(...values) * 1.08 || 1;
  const range = max - min || 1;

  const n = allPoints.length;
  const stepX = plotW / (n - 1);
  const xAt = (i) => padLeft + i * stepX;
  const yAt = (v) => padTop + plotH - ((v - min) / range) * plotH;

  const historyPath = history.map((h, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(h.y).toFixed(1)}`).join(' ');

  const forecastStartIdx = history.length - 1;
  const forecastPath = [
    `M${xAt(forecastStartIdx).toFixed(1)},${yAt(history[history.length - 1].y).toFixed(1)}`,
    ...forecast.map((f, i) => `L${xAt(forecastStartIdx + 1 + i).toFixed(1)},${yAt(f.y).toFixed(1)}`),
  ].join(' ');

  const bandTop = [
    `M${xAt(forecastStartIdx).toFixed(1)},${yAt(history[history.length - 1].y).toFixed(1)}`,
    ...forecast.map((f, i) => `L${xAt(forecastStartIdx + 1 + i).toFixed(1)},${yAt(f.high).toFixed(1)}`),
  ];
  const bandBottom = [
    ...[...forecast].reverse().map((f, i) => `L${xAt(n - 1 - i).toFixed(1)},${yAt(f.low).toFixed(1)}`),
    `L${xAt(forecastStartIdx).toFixed(1)},${yAt(history[history.length - 1].y).toFixed(1)}`,
  ];
  const bandPath = [...bandTop, ...bandBottom].join(' ') + ' Z';

  const GRID_STEPS = 4;
  const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, i) => min + (range * i) / GRID_STEPS);

  const lastHistory = history[history.length - 1];
  const lastForecast = forecast[forecast.length - 1];
  const clampLabelY = (y) => Math.min(Math.max(y, padTop + 10), height - padBottom - 4);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg" width="100%" height={height}>
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

      <path d={bandPath} fill={color} opacity="0.1" stroke="none" />
      <path d={historyPath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={forecastPath} fill="none" stroke={color} strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
      {history.map((h, i) => (
        <circle key={`h-${i}`} cx={xAt(i)} cy={yAt(h.y)} r="2.6" fill={color} />
      ))}
      {forecast.map((f, i) => (
        <circle key={`f-${i}`} cx={xAt(forecastStartIdx + 1 + i)} cy={yAt(f.y)} r="2.8" fill="var(--color-surface)" stroke={color} strokeWidth="2" />
      ))}

      {lastHistory && (
        <text x={xAt(history.length - 1)} y={clampLabelY(yAt(lastHistory.y) - 10)} textAnchor="middle" className="line-chart-value-label" fill={color}>
          {formatValue(lastHistory.y)}
        </text>
      )}
      {lastForecast && (
        <text x={xAt(n - 1)} y={clampLabelY(yAt(lastForecast.y) - 10)} textAnchor="middle" className="line-chart-value-label" fill={color}>
          {formatValue(lastForecast.y)}
        </text>
      )}

      {allPoints.map((p, i) => (
        <text key={`lbl-${i}`} x={xAt(i)} y={height - 6} textAnchor="middle" className="line-chart-axis-label line-chart-month-label">{p.label}</text>
      ))}
      <rect x={xAt(forecastStartIdx)} y={padTop} width={plotW - forecastStartIdx * stepX} height={plotH} fill="var(--color-surface-subtle)" opacity="0.35" />
    </svg>
  );
}
