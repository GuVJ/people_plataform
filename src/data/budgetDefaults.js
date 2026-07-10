function sumForYear(series, year, valueKey) {
  return series.filter((p) => new Date(p.month).getFullYear() === year).reduce((s, p) => s + p[valueKey], 0);
}

function lastForYear(series, year, valueKey) {
  const points = series.filter((p) => new Date(p.month).getFullYear() === year);
  return points.length ? points[points.length - 1][valueKey] : null;
}

// Sensible starting targets, derived from the actual dataset rather than picked out of thin
// air: 2025's target approximates what actually happened that year (so the comparison chart
// shows a realistic beat/miss), and 2026 applies typical planning assumptions on top of it
// (headcount growth, payroll growth from merit increases, a turnover reduction goal, and an
// overtime-cost reduction goal). All of this is just the *starting point* — editable on
// /orcamento/metas.
export function computeDefaultTargets(metrics) {
  const headcount2025 = lastForYear(metrics.headcountSeries, 2025, 'total') ?? metrics.activeNow.length;
  const peopleCost2025 = sumForYear(metrics.payrollSeries, 2025, 'total');
  const overtimeCost2025 = sumForYear(metrics.overtimeSeries, 2025, 'cost');
  const terminations2025 = sumForYear(metrics.terminationsSeries, 2025, 'total');
  const headcountStart2025 = lastForYear(metrics.headcountSeries, 2024, 'total') ?? headcount2025;
  const turnover2025 = (terminations2025 / (headcountStart2025 || 1)) * 100;

  const target2025 = {
    headcountTarget: Math.round(headcount2025 / 10) * 10,
    peopleCostTarget: Math.round(peopleCost2025 / 10000) * 10000,
    turnoverTarget: Math.round(turnover2025),
    overtimeCostTarget: Math.round(overtimeCost2025 / 1000) * 1000,
  };

  const target2026 = {
    headcountTarget: Math.round((target2025.headcountTarget * 1.06) / 10) * 10,
    peopleCostTarget: Math.round((target2025.peopleCostTarget * 1.09) / 10000) * 10000,
    turnoverTarget: Math.max(15, target2025.turnoverTarget - 3),
    overtimeCostTarget: Math.round((target2025.overtimeCostTarget * 0.85) / 1000) * 1000,
  };

  return { 2025: target2025, 2026: target2026 };
}

export const BUDGET_FIELDS = [
  { key: 'headcountTarget', label: 'Headcount (meta)', unit: 'pessoas', description: 'Headcount alvo para o ano.' },
  { key: 'peopleCostTarget', label: 'Custo de pessoas (meta anual)', unit: 'R$', description: 'Orçamento total de folha (salários + encargos) para o ano.' },
  { key: 'turnoverTarget', label: 'Turnover (meta anual %)', unit: '%', description: 'Taxa de turnover acumulada aceitável até dezembro.' },
  { key: 'overtimeCostTarget', label: 'Custo de horas extras (meta anual)', unit: 'R$', description: 'Orçamento total de horas extras para o ano.' },
];
