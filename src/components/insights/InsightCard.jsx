import './InsightCard.css';

const ICONS = {
  danger: '⚠',
  warning: '△',
  success: '✓',
  info: '✦',
};

export default function InsightCard({ insight }) {
  return (
    <div className={`insight-card insight-${insight.type} fade-in`}>
      <span className="insight-icon">{ICONS[insight.type] ?? '✦'}</span>
      <div>
        <p className="insight-title">{insight.title}</p>
        <p className="insight-text">{insight.text}</p>
      </div>
    </div>
  );
}
