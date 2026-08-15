import { useMemo } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useFilters } from '../../context/FilterContext.jsx';
import { AREAS, ROLE_LEVELS } from '../../data/constants.js';
import { monthKey, monthLabel } from '../../utils/dates.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import FilterSelect from './FilterSelect.jsx';
import './DashboardFilters.css';

// Barra de filtros compartilhada por todos os dashboards: diretoria, gestor, cargo e período.
export default function DashboardFilters() {
  const { tx } = useLang();
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
  const monthOptions = [{ value: '', label: 'Período completo' }, ...metrics.months.map((m) => ({ value: monthKey(m), label: `${tx('até')} ${monthLabel(m)}` }))];

  return (
    <div className="dash-filters">
      <span className="dash-filters-label">{tx('Filtros')}</span>
      <FilterSelect ariaLabel={tx('Diretoria')} placeholder="Todas as diretorias" value={filters.area} onChange={(v) => setFilter('area', v)} options={areaOptions} />
      <FilterSelect ariaLabel={tx('Gestor')} placeholder="Todos os gestores" value={filters.manager} onChange={(v) => setFilter('manager', v)} options={managerOptions} searchable />
      <FilterSelect ariaLabel={tx('Cargo')} placeholder="Todos os cargos" value={filters.role} onChange={(v) => setFilter('role', v)} options={roleOptions} />
      <FilterSelect ariaLabel={tx('Período')} placeholder="Período completo" value={filters.month} onChange={(v) => setFilter('month', v)} options={monthOptions} searchable />
      {activeCount > 0 && (
        <button type="button" className="dash-filters-clear" onClick={clearFilters}>{tx('Limpar')} ({activeCount})</button>
      )}
    </div>
  );
}
