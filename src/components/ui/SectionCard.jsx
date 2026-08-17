import './SectionCard.css';
import { useLang } from '../../i18n/LanguageContext.jsx';

// Ícone de informação com tooltip no hover/foco. Explica o que é o indicador.
export function InfoTip({ text }) {
  if (!text) return null;
  return (
    <span className="info-tip" tabIndex={0} role="note" aria-label={text} title={text}>
      i
      <span className="info-tip-bubble" role="tooltip">{text}</span>
    </span>
  );
}

export default function SectionCard({ title, subtitle, action, children, className = '', span, info }) {
  const { tx } = useLang();
  return (
    <div className={`card section-card ${className}`} style={span ? { gridColumn: `span ${span}` } : undefined}>
      {(title || action) && (
        <div className="section-card-header">
          <div>
            {title && (
              <h3 className="section-card-title">
                {tx(title)}
                {info && <InfoTip text={tx(info)} />}
              </h3>
            )}
            {subtitle && <p className="section-card-subtitle">{tx(subtitle)}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="section-card-body">{children}</div>
    </div>
  );
}
