import './HeatmapTable.css';

// rows: [{ label, values: { colKey: number }, total }]
// cols: [{ key, label }]
export default function HeatmapTable({ rows, cols, formatValue = (v) => v }) {
  const max = Math.max(...rows.flatMap((r) => cols.map((c) => r.values[c.key] ?? 0)), 1);

  return (
    <div className="heatmap-wrap">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th className="heatmap-row-header"> </th>
            {cols.map((c) => <th key={c.key}>{c.label}</th>)}
            <th className="heatmap-total-header">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="heatmap-row-header">{r.label}</td>
              {cols.map((c) => {
                const v = r.values[c.key] ?? 0;
                const alpha = v > 0 ? Math.min(0.9, 0.12 + (v / max) * 0.78) : 0;
                return (
                  <td key={c.key} className="heatmap-cell" style={{ background: `rgba(230, 17, 126, ${alpha})`, color: alpha > 0.5 ? '#fff' : 'var(--color-text)' }}>
                    {v > 0 ? formatValue(v) : '—'}
                  </td>
                );
              })}
              <td className="heatmap-total">{formatValue(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
