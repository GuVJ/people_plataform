import { useState } from 'react';
import MiniMarkdown from './MiniMarkdown.jsx';
import BarChart from '../ui/BarChart.jsx';
import Table from '../ui/Table.jsx';
import './ChatMessage.css';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  function handleCopy() {
    navigator.clipboard?.writeText(message.content.text ?? message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (isUser) {
    return (
      <div className="chat-row chat-row-user">
        <div className="chat-bubble chat-bubble-user">{message.content}</div>
      </div>
    );
  }

  const { text, chart, table, recommendations, financialImpact } = message.content;

  return (
    <div className="chat-row chat-row-assistant fade-in">
      <div className="chat-avatar-ai">✦</div>
      <div className="chat-bubble chat-bubble-assistant">
        <MiniMarkdown text={text} />

        {chart && (
          <div className="chat-chart">
            <p className="chat-chart-title">{chart.title}</p>
            <BarChart data={chart.data} valueKey={chart.valueKey} labelKey={chart.labelKey} formatValue={chart.formatValue} />
          </div>
        )}

        {table && (
          <div className="chat-table">
            <Table columns={table.columns} rows={table.rows} />
          </div>
        )}

        {financialImpact && (
          <div className="chat-callout chat-callout-financial">
            <strong>Impacto financeiro</strong>
            <span>{financialImpact}</span>
          </div>
        )}

        {recommendations?.length > 0 && (
          <div className="chat-callout chat-callout-recs">
            <strong>Recomendações</strong>
            <ul>
              {recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        <button type="button" className="chat-copy-btn" onClick={handleCopy}>
          {copied ? 'Copiado ✓' : 'Copiar resposta'}
        </button>
      </div>
    </div>
  );
}
