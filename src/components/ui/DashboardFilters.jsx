import { useMemo } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useFilters } from '../../context/FilterContext.jsx';
import { AREAS, ROLE_LEVELS } from '../../data/constants.js';
import { monthKey, monthLabel } from '../../utils/dates.js';
import './DashboardFilters.css';

// Barra de filtros compartilhada por todos os dashboards: diretoria, gestor, cargo e período.
export default function DashboardFilters() {
  const { employees, metrics } = useData();
  const { filters, setFilter, clearFilters, activeCount } = useFilters();

  const managers = useMemo(() => {
    const set = new Set();
    for (const e of employees) {
      if (e.managerName && e.managerName !== 'Diretoria' && e.managerName !== '—') set.add(e.managerName);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [employees]);

  return (
    <div className="dash-filters">
      <span className="dash-filters-label">Filtros</span>
      <select className="dash-filter" value={filters.area} onChange={(e) => setFilter('area', e.target.value)} aria-label="Diretoria">
        <option value="">Todas as diretorias</option>
        {AREAS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
      </select>
      <select className="dash-filter" value={filters.manager} onChange={(e) => setFilter('manager', e.target.value)} aria-label="Gestor">
        <option value="">Todos os gestores</option>
        {managers.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select className="dash-filter" value={filters.role} onChange={(e) => setFilter('role', e.target.value)} aria-label="Cargo">
        <option value="">Todos os cargos</option>
        {ROLE_LEVELS.map((r) => <option key={r.level} value={r.level}>{r.level}</option>)}
      </select>
      <select className="dash-filter" value={filters.month} onChange={(e) => setFilter('month', e.target.value)} aria-label="Período">
        <option value="">Período completo</option>
        {metrics.months.map((m) => <option key={monthKey(m)} value={monthKey(m)}>até {monthLabel(m)}</option>)}
      </select>
      {activeCount > 0 && (
        <button type="button" className="dash-filters-clear" onClick={clearFilters}>Limpar ({activeCount})</button>
      )}
    </div>
  );
}
