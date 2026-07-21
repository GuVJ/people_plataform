// Vercel serverless function — envia o e-mail de alerta de um gatilho via Resend.
// A chave fica server-side (RESEND_API_KEY). Sem a chave, responde 503 e o front avisa que
// o envio de e-mail ainda não está configurado (o gatilho continua sendo avaliado na tela).
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

  const { to, subject, message } = req.body ?? {};
  if (!to || !subject) {
    res.status(400).json({ error: 'Campos "to" e "subject" são obrigatórios.' });
    return;
  }

  const from = process.env.ALERT_FROM_EMAIL || 'People Analytics Copilot <alertas@peopleplataform.vercel.app>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#0f172a">${(message || '').replace(/\n/g, '<br>')}</div>`,
      }),
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
