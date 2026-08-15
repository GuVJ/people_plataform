import { useState } from 'react';
import MiniMarkdown from './MiniMarkdown.jsx';
import BarChart from '../ui/BarChart.jsx';
import Table from '../ui/Table.jsx';
import ExportButton from '../ui/ExportButton.jsx';
import EmployeeCard from './EmployeeCard.jsx';
import ExecutiveSummaryTable from '../summary/ExecutiveSummaryTable.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';
import './ChatMessage.css';

export default function ChatMessage({ message, onQuickReply }) {
  const { tx } = useLang();
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

  const { text, chart, table, execSummary, recommendations, financialImpact, source, employeeCard, initial, quickReplies } = message.content;

  return (
    <div className="chat-row chat-row-assistant fade-in">
      <div className="chat-avatar-ai">✦</div>
      <div className={`chat-bubble chat-bubble-assistant${(table || chart || execSummary) ? ' chat-bubble-wide' : ''}`}>
        {source && !employeeCard && (
          <span className={`chat-source-badge chat-source-${source}`}>
            {source === 'gemini' ? '✦ Gemini' : `⚙ ${tx('Motor local')}`}
          </span>
        )}
        <MiniMarkdown text={text} />

        {employeeCard && <EmployeeCard employee={employeeCard} />}

        {chart && (
          <div className="chat-chart">
            <p className="chat-chart-title">{chart.title}</p>
            <BarChart data={chart.data} valueKey={chart.valueKey} labelKey={chart.labelKey} formatValue={chart.formatValue} />
          </div>
        )}

        {table && (
          <div className="chat-table">
            {table.title && <p className="chat-chart-title">{table.title}</p>}
            <Table columns={table.columns} rows={table.rows} />
            <div className="chat-table-download">
              <ExportButton
                filename={table.filename || 'tabela_iris'}
                sheetName={table.sheetName || 'Tabela'}
                rows={table.exportRows || table.rows.map((r) => Object.fromEntries(table.columns.map((c) => [c.label, c.render ? c.render(r) : r[c.key]])))}
                label="Baixar Excel"
              />
            </div>
          </div>
        )}

        {execSummary && (
          <div className="chat-table">
            <ExecutiveSummaryTable rows={execSummary} />
          </div>
        )}

        {quickReplies?.length > 0 && (
          <div className="chat-quick-replies">
            {quickReplies.map((qr) => (
              <button type="button" key={qr.label} className="chat-quick-reply" onClick={() => onQuickReply?.(qr.prompt)}>
                {qr.label}
              </button>
            ))}
          </div>
        )}

        {financialImpact && (
          <div className="chat-callout chat-callout-financial">
            <strong>{tx('Impacto financeiro')}</strong>
            <span>{financialImpact}</span>
          </div>
        )}

        {recommendations?.length > 0 && (
          <div className="chat-callout chat-callout-recs">
            <strong>{tx('Recomendações')}</strong>
            <ul>
              {recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {!initial && (
          <button type="button" className="chat-copy-btn" onClick={handleCopy}>
            {copied ? `${tx('Copiado')} ✓` : tx('Copiar resposta')}
          </button>
        )}
      </div>
    </div>
  );
}
