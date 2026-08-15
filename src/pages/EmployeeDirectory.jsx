import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import { RISK_LEVEL_COLOR } from '../data/risk.js';
import { AREAS } from '../data/constants.js';
import { formatNumber, managerLabel } from '../utils/format.js';
import './EmployeeDirectory.css';

const PAGE_SIZE = 25;

function normalize(text) {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
}

export default function EmployeeDirectory() {
  const { employees, risk } = useData();
  const { tx, lang } = useLang();
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('Todas');
  const [status, setStatus] = useState('Ativo');
  const [page, setPage] = useState(1);

  const riskById = useMemo(() => new Map(risk.map((r) => [r.id, r])), [risk]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return employees
      .filter((e) => (status === 'Todos' ? true : e.status === status))
      .filter((e) => (area === 'Todas' ? true : e.area === area))
      .filter((e) => !q || normalize(e.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, query, area, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(setter) {
    return (value) => { setter(value); setPage(1); };
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Funcionários')}</h1>
          <p className="page-subtitle">{tx('Diretório completo — busque e acesse a ficha de qualquer colaborador')}</p>
        </div>
      </div>

      <SectionCard>
        <div className="directory-filters">
          <input
            className="directory-input directory-search"
            placeholder={tx('Buscar por nome…')}
            value={query}
            onChange={(e) => updateFilter(setQuery)(e.target.value)}
          />
          <select className="directory-input" value={area} onChange={(e) => updateFilter(setArea)(e.target.value)}>
            <option value="Todas">{tx('Todas as diretorias')}</option>
            {AREAS.map((a) => <option key={a.name} value={a.name}>{tx(a.name)}</option>)}
          </select>
          <select className="directory-input" value={status} onChange={(e) => updateFilter(setStatus)(e.target.value)}>
            <option value="Ativo">{tx('Ativos')}</option>
            <option value="Desligado">{tx('Desligados')}</option>
            <option value="Todos">{tx('Todos')}</option>
          </select>
          <span className="directory-count">{formatNumber(filtered.length)} {filtered.length !== 1 ? tx('colaboradores') : tx('colaborador')}</span>
        </div>

        <div className="directory-table-wrap">
          <table className="directory-table">
            <thead>
              <tr>
                <th>{tx('Nome')}</th>
                <th>{tx('Diretoria')}</th>
                <th>{tx('Cargo')}</th>
                <th>{tx('Gestor')}</th>
                <th>{tx('Tempo de casa')}</th>
                <th>{tx('Desempenho')}</th>
                <th>{tx('Risco')}</th>
                <th>{tx('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e) => {
                const r = riskById.get(e.id);
                return (
                  <tr key={e.id}>
                    <td>
                      <Link to={`/funcionario/${e.id}`} className="directory-name-cell">
                        <span className="directory-avatar">{initials(e.name)}</span>
                        {e.name}
                      </Link>
                    </td>
                    <td>{tx(e.area)}</td>
                    <td>{tx(e.roleLevel)}</td>
                    <td>{managerLabel(e.managerName, lang)}</td>
                    <td>{formatNumber(e.tenureYears, 1)} {tx('anos')}</td>
                    <td>{tx(e.performanceBucket)}</td>
                    <td>{r ? <span className={`badge badge-${RISK_LEVEL_COLOR[r.level]}`}>{tx(r.level)}</span> : <span className="text-tertiary">—</span>}</td>
                    <td><span className={`badge ${e.status === 'Ativo' ? 'badge-success' : 'badge-danger'}`}>{tx(e.status)}</span></td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={8} className="directory-empty">{tx('Nenhum colaborador encontrado para esse filtro.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="directory-pagination">
            <button type="button" className="btn btn-sm" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>← {tx('Anterior')}</button>
            <span className="text-secondary" style={{ fontSize: 12 }}>{tx('Página')} {currentPage} {tx('de')} {totalPages}</span>
            <button type="button" className="btn btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>{tx('Próxima')} →</button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
