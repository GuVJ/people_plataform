import './SchemaTable.css';

export default function SchemaTable({ table }) {
  return (
    <div className="card schema-table">
      <div className="schema-table-header">
        <div>
          <h3 className="schema-table-name">{table.name}</h3>
          <p className="schema-table-label">{table.label}</p>
        </div>
        <span className="badge badge-neutral">{table.fields.length} campos</span>
      </div>
      <p className="schema-table-desc">{table.description}</p>
      <div className="schema-field-list">
        {table.fields.map((f) => (
          <div className="schema-field-row" key={f.name}>
            <span className="schema-field-name">{f.name}</span>
            <span className="schema-field-type">{f.type}</span>
            {f.key === 'PK' && <span className="badge badge-info schema-key-badge">PK</span>}
            {f.key === 'FK' && <span className="badge badge-warning schema-key-badge" title={`Referencia ${f.references}`}>FK → {f.references}</span>}
            {f.description && <span className="schema-field-desc">{f.description}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
