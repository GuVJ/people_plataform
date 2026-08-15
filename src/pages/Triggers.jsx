import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import { useTriggers } from '../context/TriggersContext.jsx';
import { THEMES, THEME_BY_KEY } from '../data/themes.js';
import { buildExecutiveSummary } from '../data/executiveSummary.js';
import { formatByType } from '../components/ui/formatValue.js';
import './Triggers.css';

const CONDITIONS = [
  { value: 'above', label: 'passar de (acima de)' },
  { value: 'below', label: 'cair abaixo de' },
  { value: 'change', label: 'variar mais de (em módulo)' },
];

// Versões do Resumo Executivo por público. Liderança recebe o painel completo (inclui custo e
// metas); a versão de Gestão foca nos indicadores operacionais do dia a dia do time.
const AUDIENCES = {
  lideranca: {
    label: 'Liderança · CEO / Diretoria',
    title: 'Resumo Executivo — Liderança',
    intro: 'Visão consolidada dos indicadores de pessoas, com variação mensal, acumulado do ano e metas.',
    keys: null,
  },
  gestor: {
    label: 'Gestão · Gestores de time',
    title: 'Resumo Executivo — Gestão',
    intro: 'Indicadores operacionais do time para acompanhamento na rotina de gestão.',
    keys: ['headcount', 'turnover', 'absenteismo', 'horasExtras', 'admissoes', 'desligamentos'],
  },
};

function buildDigestRows(summary, keys) {
  const filtered = keys ? summary.filter((r) => keys.includes(r.key)) : summary;
  return filtered.map((r) => {
    const value = formatByType(r.current, r.format);
    const unit = r.isPP ? ' p.p.' : '%';
    const arrow = r.direction === 'flat' ? '→' : r.direction === 'up' ? '↑' : '↓';
    const variation = r.direction === 'flat' ? '→ estável' : `${arrow} ${Math.abs(r.delta).toFixed(1)}${unit}`;
    let extra = '';
    if (r.ytd) extra = `Acum. ${formatByType(r.ytd.current, r.format)}`;
    else if (r.target) extra = `Meta ${formatByType(r.target.value, r.format)} ${r.target.ok ? '✓' : '✗'}`;
    return { label: r.label, value, variation, variationGood: r.good, extra };
  });
}

function kpiForTheme(metrics, themeKey) {
  const theme = THEME_BY_KEY[themeKey];
  if (!theme) return null;
  return metrics.kpis.find((k) => k.key === theme.kpiKey) ?? null;
}

// Retorna { fired, currentText, detailText } para um gatilho contra o KPI atual.
function evaluate(trigger, kpi, tx) {
  if (!kpi) return { fired: false, currentText: '—', detailText: tx('Indicador indisponível') };
  const value = kpi.value;
  const delta = kpi.delta ?? 0;
  const isPP = kpi.format === 'percent';
  const currentText = formatByType(value, kpi.format);
  let fired = false;
  let detailText = '';

  if (trigger.condition === 'above') {
    fired = value > trigger.threshold;
    detailText = `${tx('Meta de teto')}: ${formatByType(trigger.threshold, kpi.format)}`;
  } else if (trigger.condition === 'below') {
    fired = value < trigger.threshold;
    detailText = `${tx('Piso de alerta')}: ${formatByType(trigger.threshold, kpi.format)}`;
  } else {
    fired = Math.abs(delta) >= trigger.threshold;
    const unit = isPP ? 'p.p.' : '%';
    detailText = `${tx('Variação no mês')}: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}${unit} (${tx('limite')} ${trigger.threshold}${unit})`;
  }
  return { fired, currentText, detailText };
}

export default function Triggers() {
  const { tx } = useLang();
  const { metrics } = useData();
  const { targets } = useBudget();
  const { triggers, addTrigger, removeTrigger, toggleTrigger, subscriptions, addSubscription, removeSubscription, updateSubscription } = useTriggers();

  const [themeKey, setThemeKey] = useState(THEMES[0].key);
  const [condition, setCondition] = useState('change');
  const [threshold, setThreshold] = useState(5);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subAudience, setSubAudience] = useState('lideranca');

  const summary = useMemo(() => buildExecutiveSummary(metrics, targets), [metrics, targets]);

  function handleAddSub(e) {
    e.preventDefault();
    if (!subEmail.trim()) {
      setFeedback({ type: 'error', text: tx('Informe um e-mail para adicionar à lista de envio.') });
      return;
    }
    addSubscription({ name: subName.trim() || subEmail.trim(), email: subEmail.trim(), audience: subAudience });
    setSubName('');
    setSubEmail('');
    setFeedback({ type: 'success', text: tx('Destinatário adicionado à lista de envio do Resumo Executivo.') });
  }

  function applyEmailToAll() {
    const target = subEmail.trim();
    if (!target) {
      setFeedback({ type: 'error', text: tx('Digite o e-mail no campo acima antes de aplicar a todos.') });
      return;
    }
    subscriptions.forEach((s) => updateSubscription(s.id, { email: target }));
    setFeedback({ type: 'success', text: `${tx('Todos os destinatários agora enviam para')} ${target}.` });
  }

  async function handleSendDigest(sub) {
    const cfg = AUDIENCES[sub.audience];
    const rows = buildDigestRows(summary, cfg.keys);
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    setSending(sub.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sub.email,
          subject: `[${cfg.title}] ${dateStr}`,
          digest: { title: cfg.title, audienceLabel: cfg.label, generatedAt: dateStr, intro: cfg.intro, rows, link: window.location.origin },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFeedback({ type: 'success', text: `${tx('Resumo executivo enviado para')} ${sub.email}.` });
      } else if (res.status === 503) {
        setFeedback({ type: 'info', text: tx('Envio de e-mail ainda não configurado no servidor (RESEND_API_KEY).') });
      } else {
        setFeedback({ type: 'error', text: data.error || tx('Não foi possível enviar o resumo.') });
      }
    } catch {
      setFeedback({ type: 'error', text: tx('Falha de rede ao chamar o serviço de e-mail.') });
    } finally {
      setSending(null);
    }
  }

  const evaluated = useMemo(
    () => triggers.map((t) => ({ trigger: t, kpi: kpiForTheme(metrics, t.themeKey), ...evaluate(t, kpiForTheme(metrics, t.themeKey), tx) })),
    [triggers, metrics, tx],
  );
  const firedCount = evaluated.filter((e) => e.trigger.enabled && e.fired).length;

  function handleAdd(e) {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback({ type: 'error', text: tx('Informe um e-mail para receber o alerta.') });
      return;
    }
    addTrigger({ themeKey, condition, threshold: Number(threshold), email: email.trim() });
    setFeedback({ type: 'success', text: tx('Gatilho criado. Ele é avaliado a cada abertura do painel.') });
  }

  async function handleTest(entry) {
    const { trigger, kpi, currentText, detailText } = entry;
    const theme = THEME_BY_KEY[trigger.themeKey];
    const cond = CONDITIONS.find((c) => c.value === trigger.condition);
    const thresholdText = trigger.condition === 'change'
      ? `${trigger.threshold}${kpi?.format === 'percent' ? ' p.p.' : '%'}`
      : formatByType(trigger.threshold, kpi?.format);
    setSending(trigger.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: trigger.email,
          subject: `[Alerta] ${theme?.label ?? trigger.themeKey} — ${currentText}`,
          alert: {
            indicator: theme?.label ?? trigger.themeKey,
            value: currentText,
            detail: detailText,
            rule: `${cond?.label ?? ''} ${thresholdText}`.trim(),
            fired: entry.fired,
            statusLabel: trigger.enabled ? (entry.fired ? 'Disparado' : 'Dentro do limite') : 'Pausado',
            link: `${window.location.origin}/meu-painel`,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFeedback({ type: 'success', text: `${tx('E-mail de teste enviado para')} ${trigger.email}.` });
      } else if (res.status === 503) {
        setFeedback({ type: 'info', text: tx('Envio de e-mail ainda não configurado no servidor (RESEND_API_KEY). O gatilho continua sendo avaliado aqui na tela.') });
      } else {
        setFeedback({ type: 'error', text: data.error || tx('Não foi possível enviar o e-mail.') });
      }
    } catch {
      setFeedback({ type: 'error', text: tx('Falha de rede ao chamar o serviço de e-mail.') });
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Gatilhos & Alertas')}</h1>
          <p className="page-subtitle">
            {tx('Seja avisado por e-mail quando um número cruzar um limite ou variar demais.')}
            {firedCount > 0 && <strong className="trg-fired-inline"> {firedCount} {tx('disparado(s) agora.')}</strong>}
          </p>
        </div>
      </div>

      <div className="trg-layout">
        <form className="card trg-form" onSubmit={handleAdd}>
          <h3>{tx('Novo gatilho')}</h3>
          <label className="trg-field">
            <span>{tx('Indicador')}</span>
            <select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
              {THEMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="trg-field">
            <span>{tx('Quando o valor')}</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{tx(c.label)}</option>)}
            </select>
          </label>
          <label className="trg-field">
            <span>{tx('Limite')} {condition === 'change' ? '(% / p.p.)' : ''}</span>
            <input type="number" step="0.1" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </label>
          <label className="trg-field">
            <span>{tx('Enviar e-mail para')}</span>
            <input type="email" placeholder="voce@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary">{tx('Criar gatilho')}</button>
          {feedback && <p className={`trg-feedback trg-feedback-${feedback.type}`}>{feedback.text}</p>}
          <p className="trg-hint">
            {tx('Em produção, um cron diário (Vercel Cron) reavalia os gatilhos e dispara o e-mail automaticamente. Aqui, a avaliação é ao vivo e o botão “Testar e-mail” usa o mesmo serviço.')}
          </p>
        </form>

        <div className="trg-list-wrap">
          {evaluated.length === 0 ? (
            <div className="card trg-empty">
              <h3>{tx('Nenhum gatilho ainda')}</h3>
              <p className="text-secondary" style={{ fontSize: 13.5, marginTop: 6 }}>
                {tx('Crie um gatilho ao lado — por exemplo, “avisar quando o Turnover variar mais de 2 p.p.”.')}
              </p>
            </div>
          ) : (
            <div className="trg-list">
              {evaluated.map((entry) => {
                const theme = THEME_BY_KEY[entry.trigger.themeKey];
                const cond = CONDITIONS.find((c) => c.value === entry.trigger.condition);
                const active = entry.trigger.enabled;
                return (
                  <div className={`card trg-item ${active && entry.fired ? 'trg-item-fired' : ''} ${!active ? 'trg-item-off' : ''}`} key={entry.trigger.id}>
                    <div className="trg-item-main">
                      <div className="trg-item-head">
                        <span className={`trg-status ${active ? (entry.fired ? 'fired' : 'ok') : 'off'}`}>
                          {active ? (entry.fired ? tx('Disparado') : tx('Ok')) : tx('Pausado')}
                        </span>
                        <Link to={theme?.route ?? '/'} className="trg-item-title">{theme?.label ?? entry.trigger.themeKey}</Link>
                      </div>
                      <p className="trg-item-rule">
                        {tx(cond?.label)} <strong>{entry.trigger.condition === 'change' ? `${entry.trigger.threshold}${entry.kpi?.format === 'percent' ? ' p.p.' : '%'}` : formatByType(entry.trigger.threshold, entry.kpi?.format)}</strong>
                        {' · '}{tx('atual')} <strong>{entry.currentText}</strong>
                      </p>
                      <p className="trg-item-detail">{entry.detailText} · {tx('notifica')} {entry.trigger.email}</p>
                    </div>
                    <div className="trg-item-actions">
                      <button className="btn btn-sm" onClick={() => handleTest(entry)} disabled={sending === entry.trigger.id}>
                        {sending === entry.trigger.id ? tx('Enviando…') : tx('Testar e-mail')}
                      </button>
                      <button className="btn btn-sm" onClick={() => toggleTrigger(entry.trigger.id)}>{active ? tx('Pausar') : tx('Ativar')}</button>
                      <button className="btn btn-sm trg-del" onClick={() => removeTrigger(entry.trigger.id)}>{tx('Excluir')}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 30 }}>
        <span>{tx('Envio do Resumo Executivo')}</span>
        <span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>{tx('lista de destinatários com versão por público')}</span>
      </div>

      <div className="trg-digest">
        <form className="card trg-form" onSubmit={handleAddSub}>
          <h3>{tx('Adicionar destinatário')}</h3>
          <label className="trg-field">
            <span>{tx('Nome / cargo')}</span>
            <input type="text" placeholder={tx('Ex: Diretoria Comercial')} value={subName} onChange={(e) => setSubName(e.target.value)} />
          </label>
          <label className="trg-field">
            <span>{tx('E-mail')}</span>
            <input type="email" placeholder="pessoa@empresa.com" value={subEmail} onChange={(e) => setSubEmail(e.target.value)} />
          </label>
          <label className="trg-field">
            <span>{tx('Versão do resumo')}</span>
            <select value={subAudience} onChange={(e) => setSubAudience(e.target.value)}>
              <option value="lideranca">{tx(AUDIENCES.lideranca.label)}</option>
              <option value="gestor">{tx(AUDIENCES.gestor.label)}</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary">{tx('Adicionar à lista')}</button>
          <button type="button" className="btn btn-sm" onClick={applyEmailToAll}>{tx('Usar este e-mail em todos')}</button>
          <p className="trg-hint">
            <strong>{tx('Liderança')}</strong> {tx('recebe o painel completo (com custo e metas).')} <strong>{tx('Gestão')}</strong> {tx('recebe a versão operacional do time. Em produção, um cron semanal envia a todos automaticamente.')}
          </p>
          <p className="trg-hint trg-hint-warn">
            {tx('Com o remetente de teste do Resend, o e-mail só é entregue no endereço dono da conta Resend. Para testar, adicione o')} <strong>{tx('seu próprio e-mail')}</strong> {tx('à lista. Para enviar a qualquer destinatário, verifique um domínio em resend.com/domains.')}
          </p>
        </form>

        <div className="trg-list-wrap">
          {subscriptions.length === 0 ? (
            <div className="card trg-empty">
              <h3>{tx('Lista de envio vazia')}</h3>
              <p className="text-secondary" style={{ fontSize: 13.5, marginTop: 6 }}>{tx('Adicione destinatários ao lado para enviar o Resumo Executivo.')}</p>
            </div>
          ) : (
            <div className="trg-list">
              {subscriptions.map((sub) => (
                <div className="card trg-item" key={sub.id}>
                  <div className="trg-item-main">
                    <div className="trg-item-head">
                      <span className={`trg-aud ${sub.audience}`}>{sub.audience === 'lideranca' ? tx('Liderança') : tx('Gestão')}</span>
                      <span className="trg-item-title">{sub.name}</span>
                    </div>
                    <div className="trg-sub-emailrow">
                      <input
                        className="trg-sub-email"
                        type="email"
                        value={sub.email}
                        onChange={(e) => updateSubscription(sub.id, { email: e.target.value })}
                        aria-label={tx('E-mail do destinatário')}
                      />
                      <span className="trg-item-detail">· {tx(AUDIENCES[sub.audience].title)}</span>
                    </div>
                  </div>
                  <div className="trg-item-actions">
                    <button className="btn btn-sm" onClick={() => handleSendDigest(sub)} disabled={sending === sub.id}>
                      {sending === sub.id ? tx('Enviando…') : tx('Enviar agora')}
                    </button>
                    <button className="btn btn-sm trg-del" onClick={() => removeSubscription(sub.id)}>{tx('Remover')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
