import { recordUsage } from './geminiUsage.js';

// Talks to the /api/chat serverless function (never calls Gemini directly from the browser).
// `history` é o histórico da conversa ([{role:'user'|'model', text}]) para dar memória ao chat.
export async function askGemini(message, context, history = []) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, history }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Erro ${response.status}`);
  }
  if (data.usage) recordUsage(data.usage);
  return data.text;
}
