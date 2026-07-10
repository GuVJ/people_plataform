function renderInline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) => (part.startsWith('**') && part.endsWith('**'))
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>)}
    </span>
  );
}

export default function MiniMarkdown({ text }) {
  const blocks = text.split('\n').filter((l) => l.trim().length > 0 || l === '');
  return (
    <div className="mini-markdown">
      {blocks.map((line, i) => {
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          return <p key={i} className="mini-markdown-bullet">{renderInline(line.trim().replace(/^[•-]\s*/, ''), i)}</p>;
        }
        return <p key={i}>{renderInline(line, i)}</p>;
      })}
    </div>
  );
}
