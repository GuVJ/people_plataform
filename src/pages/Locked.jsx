import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';

// Placeholder para recursos temporariamente travados (mantém o código original intacto).
export default function Locked({ title = 'Recurso', note }) {
  const { tx } = useLang();
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx(title)}</h1>
          <p className="page-subtitle">{tx('Recurso temporariamente indisponível')}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '48px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'var(--color-surface-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 style={{ margin: 0 }}>{tx('Em manutenção')}</h3>
        <p className="text-secondary" style={{ fontSize: 13.5, maxWidth: '52ch', margin: 0, lineHeight: 1.6 }}>
          {note || tx('Este recurso está travado por enquanto e voltará em breve. Enquanto isso, os demais painéis seguem disponíveis.')}
        </p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 6 }}>{tx('Voltar para o Overview')}</Link>
      </div>
    </div>
  );
}
