import './charts.css';

export default function LineChart({ history, forecast = [], color = 'var(--color-primary)', height = 220 }) {
  const width = 640;
  const padTop = 16;
  const padBottom = 26;
  const padLeft = 8;
  const padRight = 8;
  const plotH = height - padTop - padBottom;
  const plotW = width - padLeft - padRight;

  const allPoints = [...history.map((h) => ({ ...h, kind: 'history' })), ...forecast.map((f) => ({ ...f, kind: 'forecast' }))];
  const values = [...history.map((h) => h.y), ...forecast.flatMap((f) => [f.low, f.high, f.y])];
  const min = Math.min(...values, 0);
  const max = Math.max(...values) * 1.08;
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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg" width="100%" height={height}>
      <line x1={padLeft} y1={yAt(0)} x2={width - padRight} y2={yAt(0)} stroke="var(--color-border)" strokeWidth="1" />
      <path d={bandPath} fill={color} opacity="0.1" stroke="none" />
      <path d={historyPath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={forecastPath} fill="none" stroke={color} strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
      {history.map((h, i) => (
        <circle key={`h-${i}`} cx={xAt(i)} cy={yAt(h.y)} r="2.6" fill={color} />
      ))}
      {forecast.map((f, i) => (
        <circle key={`f-${i}`} cx={xAt(forecastStartIdx + 1 + i)} cy={yAt(f.y)} r="2.8" fill="var(--color-surface)" stroke={color} strokeWidth="2" />
      ))}
      {allPoints.map((p, i) => (
        (i % Math.ceil(n / 10) === 0 || i === n - 1) && (
          <text key={`lbl-${i}`} x={xAt(i)} y={height - 6} textAnchor="middle">{p.label}</text>
        )
      ))}
      <rect x={xAt(forecastStartIdx)} y={padTop} width={plotW - forecastStartIdx * stepX} height={plotH} fill="var(--color-surface-subtle)" opacity="0.35" />
    </svg>
  );
}
