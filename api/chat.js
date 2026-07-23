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
  const systemInstruction = `Você é o Copiloto de People Analytics de uma plataforma de RH. Responda SEMPRE em português do Brasil, em tom executivo e direto (2 a 6 frases; use **negrito** nos números-chave).

Os dados no bloco JSON abaixo são reais do período atual e são sua ÚNICA fonte de números. Você PODE e DEVE raciocinar sobre eles: cruzar tabelas, comparar diretorias, identificar correlações, apontar prováveis causas e priorizar ações — mesmo quando a resposta exata não vem pré-calculada. Ex.: para relacionar turnover e horas extras, percorra a tabela "diretorias" e destaque onde AS DUAS métricas são altas ao mesmo tempo (a diretoria tem turnover12m e custoHorasExtras12m no mesmo objeto).

Regras:
- Nunca invente números fora do contexto. Se faltar um número exato, use o mais próximo disponível e sinalize que é uma aproximação ou inferência.
- Só responda "não tenho esse dado" quando NÃO houver nenhuma base no contexto — não recuse perguntas analíticas que dá para responder cruzando as tabelas.
- Ao apontar correlação, deixe claro que é uma associação observada nos dados, não causalidade comprovada.
- Feche com uma recomendação acionável de uma frase quando fizer sentido.

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
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            // gemini-2.5-flash has extended "thinking" on by default, which eats into
            // maxOutputTokens before the visible answer is written — leading to answers
            // truncated mid-sentence. This is a quick Q&A use case, not a reasoning task.
            thinkingConfig: { thinkingBudget: 0 },
          },
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
