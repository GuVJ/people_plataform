import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import { RISK_LEVEL_COLOR } from '../data/risk.js';
import { AREAS } from '../data/constants.js';
import { formatNumber } from '../utils/format.js';
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
          <h1>Funcionários</h1>
          <p className="page-subtitle">Diretório completo — busque e acesse a ficha de qualquer colaborador</p>
        </div>
      </div>

      <SectionCard>
        <div className="directory-filters">
          <input
            className="directory-input directory-search"
            placeholder="Buscar por nome…"
            value={query}
            onChange={(e) => updateFilter(setQuery)(e.target.value)}
          />
          <select className="directory-input" value={area} onChange={(e) => updateFilter(setArea)(e.target.value)}>
            <option value="Todas">Todas as áreas</option>
            {AREAS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
          </select>
          <select className="directory-input" value={status} onChange={(e) => updateFilter(setStatus)(e.target.value)}>
            <option value="Ativo">Ativos</option>
            <option value="Desligado">Desligados</option>
            <option value="Todos">Todos</option>
          </select>
          <span className="directory-count">{formatNumber(filtered.length)} colaborador{filtered.length !== 1 ? 'es' : ''}</span>
        </div>

        <div className="directory-table-wrap">
          <table className="directory-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Área</th>
                <th>Cargo</th>
                <th>Gestor</th>
                <th>Tempo de casa</th>
                <th>Desempenho</th>
                <th>Risco</th>
                <th>Status</th>
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
                    <td>{e.area}</td>
                    <td>{e.roleLevel}</td>
                    <td>{e.managerName}</td>
                    <td>{formatNumber(e.tenureYears, 1)} anos</td>
                    <td>{e.performanceBucket}</td>
                    <td>{r ? <span className={`badge badge-${RISK_LEVEL_COLOR[r.level]}`}>{r.level}</span> : <span className="text-tertiary">—</span>}</td>
                    <td><span className={`badge ${e.status === 'Ativo' ? 'badge-success' : 'badge-danger'}`}>{e.status}</span></td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={8} className="directory-empty">Nenhum colaborador encontrado para esse filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="directory-pagination">
            <button type="button" className="btn btn-sm" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
            <span className="text-secondary" style={{ fontSize: 12 }}>Página {currentPage} de {totalPages}</span>
            <button type="button" className="btn btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>Próxima →</button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
