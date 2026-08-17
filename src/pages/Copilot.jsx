import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import ChatMessage from '../components/copilot/ChatMessage.jsx';
import { answerQuestion, SUGGESTED_PROMPTS, pageForQuestion } from '../data/copilotEngine.js';
import { buildCopilotContext } from '../data/copilotContext.js';
import { askGemini } from '../data/geminiClient.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import './Copilot.css';

function makeInitialMessage(tx) {
  return {
    role: 'assistant',
    content: {
      initial: true,
      text: tx('Olá! Sou a Íris, a inteligência de People Analytics. Pergunte sobre qualquer indicador de RH — posso cruzar dados, correlacionar e montar tabelas para baixar.'),
    },
  };
}

export default function Copilot() {
  const { tx } = useLang();
  const { metrics, forecasts, insights, risk, medical, safety, hr, production } = useData();
  const { targets } = useBudget();
  const [messages, setMessages] = useState(() => [makeInitialMessage(tx)]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  async function send(question) {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setInput('');
    setThinking(true);

    const localAnswer = answerQuestion(q, { metrics, forecasts, insights, risk, targets, medical, safety, hr, production });
    let answer = { ...localAnswer, source: 'local' };

    // Cards, tabelas e esclarecimentos GENUÍNOS (ambiguidade) são determinísticos — pulamos o
    // Gemini para o dado aparecer na hora e o texto não contradizer. Mas o fallback "não entendi"
    // (fallback:true) NÃO é uma resposta: mandamos a pergunta para o Gemini, que tem o contexto
    // completo de todos os indicadores; só se ele falhar mostramos os botões de esclarecimento.
    const genuineClarify = localAnswer.quickReplies && !localAnswer.fallback;
    const skipGemini = localAnswer.employeeCard || localAnswer.table || genuineClarify;
    if (!skipGemini) {
      try {
        const context = buildCopilotContext({ metrics, insights, risk, medical, safety, production, hr });
        const geminiText = await askGemini(q, context);
        // Só usa a resposta do Gemini se vier texto de verdade (evita substituir por vazio/undefined).
        if (geminiText && typeof geminiText === 'string' && geminiText.trim()) {
          // No fallback, a resposta do Gemini substitui os botões; nos demais, preserva gráfico/recomendações.
          answer = localAnswer.fallback
            ? { text: geminiText, source: 'gemini' }
            : { ...localAnswer, text: geminiText, source: 'gemini' };
        }
      } catch {
        // Gemini não configurado ou falhou — a resposta local (incl. fallback com botões) permanece.
      }
    }

    // Se o tema tem uma página de indicadores, anexa um botão para ir até ela (exceto em card de pessoa).
    if (!localAnswer.employeeCard) {
      const pageLink = pageForQuestion(q);
      if (pageLink) answer = { ...answer, pageLink };
    }

    setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    setThinking(false);
  }

  return (
    <div className="page copilot-page fade-in">
      <div className="page-header">
        <div>
          <h1>Íris · {tx('Inteligência de People Analytics')}</h1>
          <p className="page-subtitle">{tx('Pergunte em linguagem natural sobre qualquer indicador de RH')}</p>
        </div>
      </div>

      <div className="copilot-layout card">
        <div className="copilot-messages" ref={scrollRef}>
          {messages.map((m, i) => <ChatMessage key={i} message={m} onQuickReply={send} />)}
          {thinking && (
            <div className="chat-row chat-row-assistant">
              <div className="chat-avatar-ai">✦</div>
              <div className="chat-bubble chat-bubble-assistant copilot-thinking">
                <span className="copilot-dot" /><span className="copilot-dot" /><span className="copilot-dot" />
              </div>
            </div>
          )}
        </div>

        <div className="copilot-suggestions">
          {SUGGESTED_PROMPTS.map((p) => (
            <button type="button" key={p} className="copilot-chip" onClick={() => send(p)}>{tx(p)}</button>
          ))}
        </div>

        <form
          className="copilot-input-row"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <input
            type="text"
            className="copilot-input"
            placeholder={tx('Pergunte sobre turnover, absenteísmo, custo de pessoal…')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || thinking}>{tx('Enviar')}</button>
        </form>
      </div>
    </div>
  );
}
