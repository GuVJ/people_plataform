import './profile.css';

export default function ComparisonBar({ label, value, reference, diffPct, format, referenceLabel = 'média da área', higherIsBetter = null }) {
  const max = Math.max(value, reference, 0.0001) * 1.2;
  const valuePct = Math.min(100, (value / max) * 100);
  const refPct = Math.min(100, (reference / max) * 100);
  const isGood = higherIsBetter === null ? null : (higherIsBetter ? diffPct >= 0 : diffPct <= 0);

  return (
    <div className="comparison-row">
      <div className="comparison-row-top">
        <span className="comparison-label">{label}</span>
        <span className="comparison-value">
          {format(value)}
          {Math.abs(diffPct) >= 1 && (
            <span className={`comparison-delta ${isGood === null ? 'neutral' : isGood ? 'good' : 'bad'}`}>
              {diffPct >= 0 ? '+' : ''}{Math.round(diffPct)}%
            </span>
          )}
        </span>
      </div>
      <div className="comparison-track">
        <div className="comparison-fill" style={{ width: `${valuePct}%` }} />
        <div className="comparison-reference-marker" style={{ left: `${refPct}%` }} title={`${referenceLabel}: ${format(reference)}`} />
      </div>
      <span className="comparison-reference-label">{referenceLabel}: {format(reference)}</span>
    </div>
  );
}
