// Vercel serverless function — proxies chat questions to Google Gemini with HR data
// grounding. The API key stays server-side only; the client never sees it.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    return;
  }

  const { message, context } = req.body ?? {};
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Campo "message" é obrigatório.' });
    return;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const systemInstruction = `Você é o Copiloto de People Analytics de uma plataforma de RH. Responda SEMPRE em português do Brasil, em tom executivo e direto (2 a 5 frases, pode usar **negrito** para números-chave).
Use exclusivamente os dados fornecidos no bloco JSON de contexto abaixo — eles são reais do período atual. NUNCA invente números que não estejam no contexto; se a pergunta pedir algo que não está no contexto, diga que não possui esse dado específico e sugira a métrica mais próxima disponível.
Quando fizer sentido, feche a resposta com uma recomendação acionável de uma frase.

Contexto de dados (JSON):
${JSON.stringify(context ?? {}, null, 2)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
        }),
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: `Gemini respondeu ${response.status}: ${errText.slice(0, 300)}` });
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? null;

    if (!text) {
      res.status(502).json({ error: 'Resposta da Gemini veio vazia.' });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: `Falha ao chamar a Gemini: ${err.message}` });
  }
}
