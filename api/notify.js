// Vercel serverless function — envia o e-mail de alerta de um gatilho via Resend.
// A chave fica server-side (RESEND_API_KEY). Sem a chave, responde 503 e o front avisa que
// o envio de e-mail ainda não está configurado (o gatilho continua sendo avaliado na tela).

const BRAND = '#2563EB';

function esc(v) {
  return String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Monta um e-mail HTML no visual da plataforma (layout em tabela + estilos inline p/ Gmail/Outlook).
function buildAlertEmail(a) {
  const fired = !!a.fired;
  const statusText = esc(a.statusLabel || (fired ? 'Disparado' : 'Dentro do limite'));
  const statusColor = fired ? '#B42318' : '#067647';
  const statusBg = fired ? '#FEE4E2' : '#DCFAE6';
  const stripe = fired ? '#D92D20' : BRAND;
  const indicator = esc(a.indicator || 'Indicador');
  const value = esc(a.value || '—');
  const detail = esc(a.detail || '');
  const rule = esc(a.rule || '');
  const link = a.link && /^https?:\/\//.test(a.link) ? a.link : 'https://peopleplataform.vercel.app/meu-painel';
  const preheader = esc(`${a.indicator}: ${a.value}${a.detail ? ' · ' + a.detail : ''}`);

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#EEF2F9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EEF2F9;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F9;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E3E7F1;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <tr><td style="background:${BRAND};padding:18px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:16px;font-weight:700;color:#FFFFFF;letter-spacing:-.01em;">
        People Analytics <span style="color:#BFD4FE;font-weight:600;">Copilot</span>
      </td>
      <td align="right" style="font-size:11px;color:#BFD4FE;text-transform:uppercase;letter-spacing:.12em;font-weight:600;">Alerta</td>
    </tr></table>
  </td></tr>

  <tr><td style="border-left:4px solid ${stripe};padding:26px 28px 8px;">
    <span style="display:inline-block;font-size:12px;font-weight:700;color:${statusColor};background:${statusBg};border-radius:999px;padding:5px 12px;letter-spacing:.02em;">● ${statusText}</span>
    <div style="font-size:12px;color:#8A93A9;text-transform:uppercase;letter-spacing:.12em;font-weight:600;margin:18px 0 4px;">Indicador monitorado</div>
    <div style="font-size:22px;font-weight:700;color:#111830;letter-spacing:-.01em;">${indicator}</div>
    <div style="font-size:44px;font-weight:800;color:${BRAND};letter-spacing:-.02em;line-height:1.1;margin-top:6px;">${value}</div>
  </td></tr>

  <tr><td style="padding:14px 28px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
      ${rule ? `<tr>
        <td style="padding:10px 0;border-top:1px solid #EDF0F6;font-size:13px;color:#5B6684;width:120px;">Regra</td>
        <td style="padding:10px 0;border-top:1px solid #EDF0F6;font-size:13px;color:#111830;font-weight:600;">${rule}</td>
      </tr>` : ''}
      ${detail ? `<tr>
        <td style="padding:10px 0;border-top:1px solid #EDF0F6;font-size:13px;color:#5B6684;">Situação</td>
        <td style="padding:10px 0;border-top:1px solid #EDF0F6;font-size:13px;color:#111830;">${detail}</td>
      </tr>` : ''}
    </table>
  </td></tr>

  <tr><td style="padding:22px 28px 28px;">
    <a href="${esc(link)}" style="display:inline-block;background:${BRAND};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;">Abrir Meu Painel &rarr;</a>
  </td></tr>

  <tr><td style="background:#F7F9FC;border-top:1px solid #E3E7F1;padding:16px 28px;font-size:11.5px;color:#8A93A9;line-height:1.6;">
    Enviado automaticamente pelo <strong style="color:#5B6684;">People Analytics Copilot</strong>. Projeto de portfólio — dados 100% fictícios.
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// Monta o e-mail do Resumo Executivo — cabeçalho + tabela de indicadores (Indicador, Atual,
// Variação, Acum./Meta), com a variação colorida por good/bad.
function buildDigestEmail(d) {
  const title = esc(d.title || 'Resumo Executivo');
  const audience = esc(d.audienceLabel || '');
  const generatedAt = esc(d.generatedAt || '');
  const intro = esc(d.intro || '');
  const link = d.link && /^https?:\/\//.test(d.link) ? d.link : 'https://peopleplataform.vercel.app/';
  const rows = Array.isArray(d.rows) ? d.rows : [];

  const rowsHtml = rows.map((r, i) => {
    const varColor = r.variationGood === true ? '#067647' : r.variationGood === false ? '#B42318' : '#5B6684';
    const bg = i % 2 ? '#F7F9FC' : '#FFFFFF';
    return `<tr>
      <td style="padding:11px 14px;border-top:1px solid #EDF0F6;font-size:13px;color:#111830;font-weight:600;background:${bg};">${esc(r.label)}</td>
      <td style="padding:11px 14px;border-top:1px solid #EDF0F6;font-size:13px;color:#111830;text-align:right;font-variant-numeric:tabular-nums;background:${bg};">${esc(r.value)}</td>
      <td style="padding:11px 14px;border-top:1px solid #EDF0F6;font-size:13px;color:${varColor};text-align:right;font-weight:600;white-space:nowrap;background:${bg};">${esc(r.variation || '—')}</td>
      <td style="padding:11px 14px;border-top:1px solid #EDF0F6;font-size:12px;color:#5B6684;text-align:right;background:${bg};">${esc(r.extra || '')}</td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#EEF2F9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EEF2F9;">${title} — ${audience} ${generatedAt}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F9;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E3E7F1;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <tr><td style="background:${BRAND};padding:20px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:16px;font-weight:700;color:#FFFFFF;">People Analytics <span style="color:#BFD4FE;font-weight:600;">Copilot</span></td>
      <td align="right" style="font-size:11px;color:#BFD4FE;text-transform:uppercase;letter-spacing:.12em;font-weight:600;">Resumo Executivo</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:24px 28px 6px;">
    <div style="font-size:12px;color:#8A93A9;text-transform:uppercase;letter-spacing:.12em;font-weight:600;">${audience}${generatedAt ? ' · ' + generatedAt : ''}</div>
    <div style="font-size:22px;font-weight:700;color:#111830;letter-spacing:-.01em;margin-top:6px;">${title}</div>
    ${intro ? `<p style="font-size:13.5px;color:#5B6684;line-height:1.6;margin:10px 0 0;">${intro}</p>` : ''}
  </td></tr>

  <tr><td style="padding:16px 28px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDF0F6;border-radius:12px;overflow:hidden;">
      <tr>
        <th style="padding:9px 14px;text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#8A93A9;background:#F1F5FB;">Indicador</th>
        <th style="padding:9px 14px;text-align:right;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#8A93A9;background:#F1F5FB;">Mês atual</th>
        <th style="padding:9px 14px;text-align:right;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#8A93A9;background:#F1F5FB;">Variação</th>
        <th style="padding:9px 14px;text-align:right;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#8A93A9;background:#F1F5FB;">Acum./Meta</th>
      </tr>
      ${rowsHtml}
    </table>
  </td></tr>

  <tr><td style="padding:20px 28px 26px;">
    <a href="${esc(link)}" style="display:inline-block;background:${BRAND};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;">Abrir o painel completo &rarr;</a>
  </td></tr>

  <tr><td style="background:#F7F9FC;border-top:1px solid #E3E7F1;padding:16px 28px;font-size:11.5px;color:#8A93A9;line-height:1.6;">
    Enviado pelo <strong style="color:#5B6684;">People Analytics Copilot</strong>. Projeto de portfólio — dados 100% fictícios.
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Envio de e-mail não configurado (defina RESEND_API_KEY no servidor).' });
    return;
  }

  const { to, subject, message, alert, digest } = req.body ?? {};
  if (!to || !subject) {
    res.status(400).json({ error: 'Campos "to" e "subject" são obrigatórios.' });
    return;
  }

  // onboarding@resend.dev é o remetente de teste do Resend — funciona sem domínio verificado,
  // mas só entrega para o e-mail dono da conta Resend. Para produção, defina ALERT_FROM_EMAIL
  // com um endereço de um domínio verificado no Resend.
  const from = process.env.ALERT_FROM_EMAIL || 'People Analytics Copilot <onboarding@resend.dev>';

  const html = digest
    ? buildDigestEmail(digest)
    : alert
      ? buildAlertEmail(alert)
      : `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#0f172a">${(message || '').replace(/\n/g, '<br>')}</div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(502).json({ error: `Resend respondeu ${response.status}: ${err.slice(0, 300)}` });
      return;
    }

    const data = await response.json();
    res.status(200).json({ ok: true, id: data.id ?? null });
  } catch (err) {
    res.status(500).json({ error: `Falha ao enviar e-mail: ${err.message}` });
  }
}

export { buildAlertEmail, buildDigestEmail };
