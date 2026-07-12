import { useMemo, useState } from 'react';
import './Table.css';

function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR', { numeric: true });
}

// columns: [{ key, label, align, render, sortable?, sortAccessor? }]
// A column is sortable automatically when its values are numbers; pass sortable/sortAccessor
// to force it or to sort by a value other than row[key] (e.g. a badge column backed by a score).
export default function Table({ columns, rows, rowKey = (r, i) => i }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sortableKeys = useMemo(() => {
    const set = new Set();
    for (const c of columns) {
      if (c.sortable === false) continue;
      if (c.sortable === true || c.sortAccessor) { set.add(c.key); continue; }
      if (rows.some((r) => typeof r[c.key] === 'number')) set.add(c.key);
    }
    return set;
  }, [columns, rows]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    const accessor = col?.sortAccessor || ((r) => r[sortKey]);
    const arr = [...rows];
    arr.sort((r1, r2) => {
      const cmp = compareValues(accessor(r1), accessor(r2));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir, columns]);

  function handleSort(key) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir('asc'); }
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => {
              const sortable = sortableKeys.has(c.key);
              const active = sortKey === c.key;
              if (!sortable) {
                return <th key={c.key} style={{ textAlign: c.align || 'left' }}>{c.label}</th>;
              }
              return (
                <th key={c.key} style={{ textAlign: c.align || 'left' }} className={`th-sortable${active ? ' active' : ''}`} aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" className="th-sort-btn" onClick={() => handleSort(c.key)} style={{ justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    <span>{c.label}</span>
                    <span className={`th-sort-ind${active ? ' active' : ''}`}>{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="table-empty">Nenhum dado disponível para este recorte.</p>}
    </div>
  );
}
