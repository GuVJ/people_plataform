import { useMemo } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useFilters } from '../../context/FilterContext.jsx';
import { AREAS, ROLE_LEVELS } from '../../data/constants.js';
import { monthKey, monthLabel } from '../../utils/dates.js';
import FilterSelect from './FilterSelect.jsx';
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

  const areaOptions = [{ value: '', label: 'Todas as diretorias' }, ...AREAS.map((a) => ({ value: a.name, label: a.name }))];
  const managerOptions = [{ value: '', label: 'Todos os gestores' }, ...managers.map((m) => ({ value: m, label: m }))];
  const roleOptions = [{ value: '', label: 'Todos os cargos' }, ...ROLE_LEVELS.map((r) => ({ value: r.level, label: r.level }))];
  const monthOptions = [{ value: '', label: 'Período completo' }, ...metrics.months.map((m) => ({ value: monthKey(m), label: `até ${monthLabel(m)}` }))];

  return (
    <div className="dash-filters">
      <span className="dash-filters-label">Filtros</span>
      <FilterSelect ariaLabel="Diretoria" placeholder="Todas as diretorias" value={filters.area} onChange={(v) => setFilter('area', v)} options={areaOptions} />
      <FilterSelect ariaLabel="Gestor" placeholder="Todos os gestores" value={filters.manager} onChange={(v) => setFilter('manager', v)} options={managerOptions} searchable />
      <FilterSelect ariaLabel="Cargo" placeholder="Todos os cargos" value={filters.role} onChange={(v) => setFilter('role', v)} options={roleOptions} />
      <FilterSelect ariaLabel="Período" placeholder="Período completo" value={filters.month} onChange={(v) => setFilter('month', v)} options={monthOptions} searchable />
      {activeCount > 0 && (
        <button type="button" className="dash-filters-clear" onClick={clearFilters}>Limpar ({activeCount})</button>
      )}
    </div>
  );
}
