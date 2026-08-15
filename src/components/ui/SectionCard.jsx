import './SectionCard.css';
import { useLang } from '../../i18n/LanguageContext.jsx';

export default function SectionCard({ title, subtitle, action, children, className = '', span }) {
  const { tx } = useLang();
  return (
    <div className={`card section-card ${className}`} style={span ? { gridColumn: `span ${span}` } : undefined}>
      {(title || action) && (
        <div className="section-card-header">
          <div>
            {title && <h3 className="section-card-title">{tx(title)}</h3>}
            {subtitle && <p className="section-card-subtitle">{tx(subtitle)}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="section-card-body">{children}</div>
    </div>
  );
}
