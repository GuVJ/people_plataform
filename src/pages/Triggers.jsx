import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useTriggers } from '../context/TriggersContext.jsx';
import { THEMES, THEME_BY_KEY } from '../data/themes.js';
import { formatByType } from '../components/ui/formatValue.js';
import './Triggers.css';

const CONDITIONS = [
  { value: 'above', label: 'passar de (acima de)' },
  { value: 'below', label: 'cair abaixo de' },
  { value: 'change', label: 'variar mais de (em módulo)' },
];

function kpiForTheme(metrics, themeKey) {
  const theme = THEME_BY_KEY[themeKey];
  if (!theme) return null;
  return metrics.kpis.find((k) => k.key === theme.kpiKey) ?? null;
}

// Retorna { fired, currentText, detailText } para um gatilho contra o KPI atual.
function evaluate(trigger, kpi) {
  if (!kpi) return { fired: false, currentText: '—', detailText: 'Indicador indisponível' };
  const value = kpi.value;
  const delta = kpi.delta ?? 0;
  const isPP = kpi.format === 'percent';
  const currentText = formatByType(value, kpi.format);
  let fired = false;
  let detailText = '';

  if (trigger.condition === 'above') {
    fired = value > trigger.threshold;
    detailText = `Meta de teto: ${formatByType(trigger.threshold, kpi.format)}`;
  } else if (trigger.condition === 'below') {
    fired = value < trigger.threshold;
    detailText = `Piso de alerta: ${formatByType(trigger.threshold, kpi.format)}`;
  } else {
    fired = Math.abs(delta) >= trigger.threshold;
    const unit = isPP ? 'p.p.' : '%';
    detailText = `Variação no mês: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}${unit} (limite ${trigger.threshold}${unit})`;
  }
  return { fired, currentText, detailText };
}

export default function Triggers() {
  const { metrics } = useData();
  const { triggers, addTrigger, removeTrigger, toggleTrigger } = useTriggers();

  const [themeKey, setThemeKey] = useState(THEMES[0].key);
  const [condition, setCondition] = useState('change');
  const [threshold, setThreshold] = useState(5);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const evaluated = useMemo(
    () => triggers.map((t) => ({ trigger: t, kpi: kpiForTheme(metrics, t.themeKey), ...evaluate(t, kpiForTheme(metrics, t.themeKey)) })),
    [triggers, metrics],
  );
  const firedCount = evaluated.filter((e) => e.trigger.enabled && e.fired).length;

  function handleAdd(e) {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback({ type: 'error', text: 'Informe um e-mail para receber o alerta.' });
      return;
    }
    addTrigger({ themeKey, condition, threshold: Number(threshold), email: email.trim() });
    setFeedback({ type: 'success', text: 'Gatilho criado. Ele é avaliado a cada abertura do painel.' });
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
        setFeedback({ type: 'success', text: `E-mail de teste enviado para ${trigger.email}.` });
      } else if (res.status === 503) {
        setFeedback({ type: 'info', text: 'Envio de e-mail ainda não configurado no servidor (RESEND_API_KEY). O gatilho continua sendo avaliado aqui na tela.' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Não foi possível enviar o e-mail.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Falha de rede ao chamar o serviço de e-mail.' });
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Gatilhos & Alertas</h1>
          <p className="page-subtitle">
            Seja avisado por e-mail quando um número cruzar um limite ou variar demais.
            {firedCount > 0 && <strong className="trg-fired-inline"> {firedCount} disparado(s) agora.</strong>}
          </p>
        </div>
      </div>

      <div className="trg-layout">
        <form className="card trg-form" onSubmit={handleAdd}>
          <h3>Novo gatilho</h3>
          <label className="trg-field">
            <span>Indicador</span>
            <select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
              {THEMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="trg-field">
            <span>Quando o valor</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="trg-field">
            <span>Limite {condition === 'change' ? '(% / p.p.)' : ''}</span>
            <input type="number" step="0.1" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </label>
          <label className="trg-field">
            <span>Enviar e-mail para</span>
            <input type="email" placeholder="voce@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary">Criar gatilho</button>
          {feedback && <p className={`trg-feedback trg-feedback-${feedback.type}`}>{feedback.text}</p>}
          <p className="trg-hint">
            Em produção, um cron diário (Vercel Cron) reavalia os gatilhos e dispara o e-mail automaticamente. Aqui, a avaliação é ao vivo e o botão “Testar e-mail” usa o mesmo serviço.
          </p>
        </form>

        <div className="trg-list-wrap">
          {evaluated.length === 0 ? (
            <div className="card trg-empty">
              <h3>Nenhum gatilho ainda</h3>
              <p className="text-secondary" style={{ fontSize: 13.5, marginTop: 6 }}>
                Crie um gatilho ao lado — por exemplo, “avisar quando o Turnover variar mais de 2 p.p.”.
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
                          {active ? (entry.fired ? 'Disparado' : 'Ok') : 'Pausado'}
                        </span>
                        <Link to={theme?.route ?? '/'} className="trg-item-title">{theme?.label ?? entry.trigger.themeKey}</Link>
                      </div>
                      <p className="trg-item-rule">
                        {cond?.label} <strong>{entry.trigger.condition === 'change' ? `${entry.trigger.threshold}${entry.kpi?.format === 'percent' ? ' p.p.' : '%'}` : formatByType(entry.trigger.threshold, entry.kpi?.format)}</strong>
                        {' · '}atual <strong>{entry.currentText}</strong>
                      </p>
                      <p className="trg-item-detail">{entry.detailText} · notifica {entry.trigger.email}</p>
                    </div>
                    <div className="trg-item-actions">
                      <button className="btn btn-sm" onClick={() => handleTest(entry)} disabled={sending === entry.trigger.id}>
                        {sending === entry.trigger.id ? 'Enviando…' : 'Testar e-mail'}
                      </button>
                      <button className="btn btn-sm" onClick={() => toggleTrigger(entry.trigger.id)}>{active ? 'Pausar' : 'Ativar'}</button>
                      <button className="btn btn-sm trg-del" onClick={() => removeTrigger(entry.trigger.id)}>Excluir</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
