import { useEffect, useState } from 'react';
import { askGemini } from '../../data/geminiClient.js';
import MiniMarkdown from '../copilot/MiniMarkdown.jsx';
import './profile.css';

export default function AIInsightPanel({ question, context, localText, cacheKey }) {
  const [state, setState] = useState({ text: localText, source: 'local' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setState({ text: localText, source: 'local' });

    askGemini(question, context)
      .then((text) => { if (!cancelled) setState({ text, source: 'gemini' }); })
      .catch(() => { /* keep local text */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return (
    <div className="card ai-insight-panel fade-in">
      <div className="ai-insight-header">
        <span className="ai-insight-icon">✦</span>
        <span className="ai-insight-title">Análise do Copiloto</span>
        <span className={`badge ${state.source === 'gemini' ? 'badge-info' : 'badge-neutral'} ai-insight-badge`}>
          {loading ? 'Gerando…' : state.source === 'gemini' ? '✦ Gemini' : '⚙ Motor local'}
        </span>
      </div>
      <MiniMarkdown text={state.text} />
    </div>
  );
}
