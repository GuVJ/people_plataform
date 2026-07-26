import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FilterContext.jsx';
import { deriveMetrics } from '../data/deriveMetrics.js';
import { buildMedicalLeave } from '../data/medicalLeave.js';
import { buildSafety } from '../data/safety.js';
import { monthKey, endOfMonth } from '../utils/dates.js';

// Recomputa métricas/atestados/segurança sobre o subconjunto de funcionários que passa nos
// filtros globais (diretoria, gestor, cargo, período). Sem filtros, devolve os dados prontos
// do DataContext (sem recomputar).
export function useDashboardData() {
  const { employees, metrics, medical, safety } = useData();
  const { filters } = useFilters();

  return useMemo(() => {
    const active = filters.area || filters.manager || filters.role || filters.month;
    if (!active) return { metrics, medical, safety };

    let emps = employees;
    if (filters.area) emps = emps.filter((e) => e.area === filters.area);
    if (filters.manager) emps = emps.filter((e) => e.managerName === filters.manager);
    if (filters.role) emps = emps.filter((e) => e.roleLevel === filters.role);

    let months = metrics.months;
    let referenceDate = metrics.referenceDate;
    if (filters.month) {
      const idx = months.findIndex((m) => monthKey(m) === filters.month);
      if (idx >= 0) {
        months = months.slice(0, idx + 1);
        referenceDate = endOfMonth(months[months.length - 1]);
      }
    }

    const fMetrics = deriveMetrics(emps, months, referenceDate);
    const fMedical = buildMedicalLeave(emps, months);
    const fSafety = buildSafety(emps, months, referenceDate);
    return { metrics: fMetrics, medical: fMedical, safety: fSafety };
  }, [employees, metrics, medical, safety, filters]);
}
