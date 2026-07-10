import './SectionCard.css';

export default function SectionCard({ title, subtitle, action, children, className = '', span }) {
  return (
    <div className={`card section-card ${className}`} style={span ? { gridColumn: `span ${span}` } : undefined}>
      {(title || action) && (
        <div className="section-card-header">
          <div>
            {title && <h3 className="section-card-title">{title}</h3>}
            {subtitle && <p className="section-card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="section-card-body">{children}</div>
    </div>
  );
}
