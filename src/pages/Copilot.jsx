import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import ChatMessage from '../components/copilot/ChatMessage.jsx';
import { answerQuestion, SUGGESTED_PROMPTS } from '../data/copilotEngine.js';
import { buildCopilotContext } from '../data/copilotContext.js';
import { askGemini } from '../data/geminiClient.js';
import './Copilot.css';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: {
    text: 'Olá! Sou o Copiloto de People Analytics. Posso responder perguntas sobre turnover, absenteísmo, headcount, custo de pessoal, horas extras, diversidade, treinamentos e risco de saída — sempre com base nos dados atuais da plataforma. O que você quer entender hoje?',
  },
};

export default function Copilot() {
  const { metrics, forecasts, insights, risk } = useData();
  const { targets } = useBudget();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
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

    const localAnswer = answerQuestion(q, { metrics, forecasts, insights, risk, targets });
    let answer = { ...localAnswer, source: 'local' };

    // Employee lookups are a deterministic card, not a generative summary — skip the Gemini
    // round-trip entirely so the profile always shows up instantly and doesn't get reworded.
    if (!localAnswer.employeeCard) {
      try {
        const context = buildCopilotContext({ metrics, insights, risk });
        const geminiText = await askGemini(q, context);
        answer = { ...localAnswer, text: geminiText, source: 'gemini' };
      } catch {
        // Gemini not configured yet or request failed — the grounded local answer above still stands.
      }
    }

    setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    setThinking(false);
  }

  return (
    <div className="page copilot-page fade-in">
      <div className="page-header">
        <div>
          <h1>Copiloto de People Analytics</h1>
          <p className="page-subtitle">Pergunte em linguagem natural sobre qualquer indicador de RH</p>
        </div>
      </div>

      <div className="copilot-layout card">
        <div className="copilot-messages" ref={scrollRef}>
          {messages.map((m, i) => <ChatMessage key={i} message={m} />)}
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
            <button type="button" key={p} className="copilot-chip" onClick={() => send(p)}>{p}</button>
          ))}
        </div>

        <form
          className="copilot-input-row"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <input
            type="text"
            className="copilot-input"
            placeholder="Pergunte sobre turnover, absenteísmo, custo de pessoal…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || thinking}>Enviar</button>
        </form>
      </div>
    </div>
  );
}
