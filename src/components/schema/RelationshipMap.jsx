import './RelationshipMap.css';

export default function RelationshipMap({ relationships }) {
  return (
    <div className="card relationship-map">
      <div className="relationship-hub">
        <span className="relationship-hub-badge">funcionarios.id</span>
        <span className="relationship-hub-caption">chave de comunicação central (matrícula)</span>
      </div>
      <div className="relationship-list">
        {relationships.map((r) => (
          <div className="relationship-row" key={`${r.from}-${r.to}`}>
            <span className="relationship-from">{r.from}</span>
            <span className="relationship-arrow">→</span>
            <span className="relationship-to">{r.to}</span>
            <span className="badge badge-neutral relationship-cardinality">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
