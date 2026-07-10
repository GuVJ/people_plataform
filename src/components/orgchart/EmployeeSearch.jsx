import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeSearch.css';

function normalize(text) {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function EmployeeSearch({ employees, placeholder = 'Buscar funcionário por nome…' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  const matches = query.trim().length >= 2
    ? employees.filter((e) => normalize(e.name).includes(normalize(query))).slice(0, 8)
    : [];

  function goTo(id) {
    setQuery('');
    setOpen(false);
    navigate(`/funcionario/${id}`);
  }

  return (
    <div className="employee-search" ref={boxRef}>
      <svg className="employee-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        className="employee-search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="employee-search-results fade-in">
          {matches.map((e) => (
            <button type="button" key={e.id} className="employee-search-result" onMouseDown={() => goTo(e.id)}>
              <span className="employee-search-avatar">{e.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
              <span>
                <span className="employee-search-name">{e.name}</span>
                <span className="employee-search-meta">{e.roleLevel} · {e.area}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
