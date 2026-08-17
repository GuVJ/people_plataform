// Rastreamento do consumo do Gemini (quantidade de chamadas + tokens) acumulado em
// localStorage. Como a plataforma não tem banco, o consumo é contabilizado por navegador
// a partir do usageMetadata que a API retorna a cada resposta.
const KEY = 'pac-gemini-usage';

// Preços do gemini-2.5-flash (USD por 1 milhão de tokens) — ESTIMATIVA, ajuste se mudar.
export const RATES = { inputPerMTokens: 0.30, outputPerMTokens: 2.50, usdToBrl: 5.40 };

const EMPTY = { calls: 0, promptTokens: 0, outputTokens: 0, totalTokens: 0, firstAt: null, lastAt: null };

export function getUsage() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...EMPTY };
  }
}

export function recordUsage(usage) {
  if (!usage || typeof window === 'undefined') return;
  try {
    const cur = getUsage();
    const prompt = usage.promptTokens || 0;
    const output = usage.outputTokens || 0;
    const next = {
      calls: cur.calls + 1,
      promptTokens: cur.promptTokens + prompt,
      outputTokens: cur.outputTokens + output,
      totalTokens: cur.totalTokens + (usage.totalTokens || prompt + output),
      firstAt: cur.firstAt || new Date().toISOString(),
      lastAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignora falha de storage */
  }
}

export function estimateCost(usage) {
  const inUsd = (usage.promptTokens / 1e6) * RATES.inputPerMTokens;
  const outUsd = (usage.outputTokens / 1e6) * RATES.outputPerMTokens;
  const usd = inUsd + outUsd;
  return { usd, brl: usd * RATES.usdToBrl, inUsd, outUsd };
}

export function resetUsage() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
