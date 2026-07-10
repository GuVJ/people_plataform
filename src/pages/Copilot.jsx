import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext.jsx';
import ChatMessage from '../components/copilot/ChatMessage.jsx';
import { answerQuestion, SUGGESTED_PROMPTS } from '../data/copilotEngine.js';
import './Copilot.css';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: {
    text: 'Olá! Sou o Copiloto de People Analytics. Posso responder perguntas sobre turnover, absenteísmo, headcount, custo de pessoal, horas extras, diversidade, treinamentos e risco de saída — sempre com base nos dados atuais da plataforma. O que você quer entender hoje?',
  },
};

export default function Copilot() {
  const { metrics, forecasts, insights, risk } = useData();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  function send(question) {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const answer = answerQuestion(q, { metrics, forecasts, insights, risk });
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
      setThinking(false);
    }, 550);
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
