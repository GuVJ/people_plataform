import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';
import { AI_FRAMEWORKS as FRAMEWORKS, AI_PRINCIPLES as PRINCIPLES, AI_CAPABILITIES as CAPABILITIES } from '../data/aiRules.js';
import './RulesAI.css';

export default function RulesAI() {
  const { tx } = useLang();
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Regras e governança da IA')}</h1>
          <p className="page-subtitle">{tx('Como a Íris funciona, com base nos frameworks de IA responsável usados no mercado')}</p>
        </div>
        <Link to="/configuracoes" className="btn btn-sm">← {tx('Configurações')}</Link>
      </div>

      <div className="rules-intro card">
        <p>
          {tx('As regras da')} <strong>Íris</strong> {tx('seguem os padrões atuais de')} <strong>{tx('IA responsável')}</strong>: {tx('os frameworks internacionais de governança e a regulação brasileira. Cada princípio abaixo mostra o que o mercado adota e, ao lado, como a Íris aplica na prática.')}
        </p>
        <div className="rules-frameworks">
          {FRAMEWORKS.map((f) => (
            <div className="rules-fw" key={f.label}>
              <span className="rules-fw-label">{f.label}</span>
              <span className="rules-fw-desc">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-title"><span>{tx('O que a Íris faz')}</span><span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>{tx('capacidades e regras operacionais')}</span></div>
      <ol className="rules-ops">
        {CAPABILITIES.map((c, i) => (
          <li className="rules-op" key={c.title}>
            <span className="rules-op-num">{i + 1}</span>
            <div className="rules-op-body">
              <span className="rules-op-title">{c.title}</span>
              <span className="rules-op-desc">{c.desc}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="section-title" style={{ marginTop: 28 }}><span>{tx('Princípios de governança')}</span><span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>{tx('frameworks de IA responsável')}</span></div>
      <div className="rules-grid">
        {PRINCIPLES.map((p, i) => (
          <div className="rules-card card" key={p.title}>
            <div className="rules-card-head">
              <span className="rules-card-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rules-card-tag">{p.tag}</span>
            </div>
            <h3 className="rules-card-title">{p.title}</h3>
            <p className="rules-card-market">{p.market}</p>
            <div className="rules-card-iris">
              <span className="rules-card-iris-label">{tx('Na Íris')}</span>
              <span>{p.iris}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="rules-foot">
        {tx('Referências')}: NIST AI Risk Management Framework · ISO/IEC 42001 · EU AI Act · LGPD (Lei 13.709/2018) · PL 2338/2023.
        {' '}{tx('A Íris está no menu')} <Link to="/copilot">Íris IA</Link>.
      </p>
    </div>
  );
}
