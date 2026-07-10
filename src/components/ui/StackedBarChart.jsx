import './StackedBarChart.css';

// data: [{ label, total, values: { seriesKey: number } }]
// series: [{ key, label, color }]
export default function StackedBarChart({ data, series, height = 200, formatValue = (v) => v }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const plotH = height - 24;

  return (
    <div className="stacked-chart">
      <div className="stacked-chart-plot" style={{ height }}>
        {data.map((d, i) => (
          <div className="stacked-chart-col" key={d.label ?? i}>
            <span className="stacked-chart-total">{d.total > 0 ? formatValue(d.total) : ''}</span>
            <div className="stacked-chart-bar" style={{ height: `${Math.max((d.total / max) * plotH, d.total > 0 ? 3 : 0)}px` }}>
              {series.map((s) => {
                const v = d.values[s.key] ?? 0;
                if (!v) return null;
                const segHeight = (v / (d.total || 1)) * 100;
                const segPx = (v / max) * plotH;
                return (
                  <div key={s.key} className="stacked-chart-seg" style={{ height: `${segHeight}%`, background: s.color }} title={`${s.label}: ${formatValue(v)}`}>
                    {segPx >= 15 && <span className="stacked-chart-seg-label">{formatValue(v)}</span>}
                  </div>
                );
              })}
            </div>
            <span className="stacked-chart-label">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        {series.map((s) => (
          <div className="chart-legend-item" key={s.key}>
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
