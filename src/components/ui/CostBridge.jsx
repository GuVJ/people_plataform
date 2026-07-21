import './CostBridge.css';

// steps: [{ label, value, kind: 'base' | 'delta' | 'total' }]
// Renders a horizontal waterfall (bridge): base and total are full bars from zero; each delta
// is a floating bar spanning the running total before/after, colored by whether cost rose or fell.
export default function CostBridge({ steps, formatValue = (v) => v }) {
  let running = 0;
  const rows = steps.map((s) => {
    if (s.kind === 'base') {
      running = s.value;
      return { ...s, start: 0, end: s.value, total: s.value };
    }
    if (s.kind === 'total') {
      return { ...s, start: 0, end: s.value, total: s.value };
    }
    const start = running;
    running += s.value;
    return { ...s, start: Math.min(start, running), end: Math.max(start, running), total: running };
  });

  const max = Math.max(...rows.map((r) => r.end), 1);

  return (
    <div className="cost-bridge">
      {rows.map((r, i) => {
        const leftPct = (r.start / max) * 100;
        const widthPct = Math.max(((r.end - r.start) / max) * 100, r.kind === 'delta' && r.value !== 0 ? 0.8 : 0);
        const tone = r.kind === 'base' ? 'base' : r.kind === 'total' ? 'total' : r.value > 0 ? 'up' : 'down';
        return (
          <div className="cost-bridge-row" key={i}>
            <span className="cost-bridge-label">{r.label}</span>
            <div className="cost-bridge-track">
              <div className={`cost-bridge-bar ${tone}`} style={{ left: `${leftPct}%`, width: `${widthPct}%` }} />
            </div>
            <span className={`cost-bridge-value ${tone}`}>
              {r.kind === 'delta' ? `${r.value > 0 ? '+' : r.value < 0 ? '−' : ''}${formatValue(Math.abs(r.value))}` : formatValue(r.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
