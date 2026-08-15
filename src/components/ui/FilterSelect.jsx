import { useState, useRef, useEffect } from 'react';
import { useLang } from '../../i18n/LanguageContext.jsx';

// Dropdown customizado (substitui o <select> nativo) para o menu aberto seguir o estilo do app.
// options: [{ value, label }]
export default function FilterSelect({ value, onChange, options, placeholder, searchable = false, ariaLabel }) {
  const { tx } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  function choose(v) {
    onChange(v);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="fsel" ref={ref}>
      <button
        type="button"
        className={`fsel-btn${open ? ' open' : ''}${value ? ' has-value' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="fsel-value">{selected ? tx(selected.label) : tx(placeholder)}</span>
        <svg className="fsel-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="fsel-menu fade-in" role="listbox">
          {searchable && (
            <input
              className="fsel-search"
              type="text"
              placeholder={tx('Buscar…')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          )}
          <div className="fsel-options">
            {filtered.map((o) => (
              <button
                key={o.value || '__all'}
                type="button"
                className={`fsel-option${o.value === value ? ' active' : ''}`}
                onClick={() => choose(o.value)}
                role="option"
                aria-selected={o.value === value}
              >
                {tx(o.label)}
              </button>
            ))}
            {!filtered.length && <div className="fsel-empty">{tx('Nada encontrado')}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
