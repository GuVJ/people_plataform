import { sparklineForKpi } from '../utils/kpiSeries.js';

// Which KPIs have a budget target, and how the (annual) budget target maps to a monthly-
// comparable value. `monthly: true` means the annual target is pro-rated by /12 to line up
// with a monthly KPI (custo de pessoas, horas extras, turnover pace); headcount is a level.
const TARGET_MAP = {
  headcount: { field: 'headcountTarget', monthly: false, lowerIsBetter: false },
  turnover: { field: 'turnoverTarget', monthly: true, lowerIsBetter: true },
  custoPessoal: { field: 'peopleCostTarget', monthly: true, lowerIsBetter: true },
  horasExtras: { field: 'overtimeCostTarget', monthly: true, lowerIsBetter: true },
};

export function buildExecutiveSummary(metrics, targets) {
  const t = targets ? targets[2026] : null;

  return metrics.kpis.map((k) => {
    const series = sparklineForKpi(metrics, k.key);
    const current = k.value;
    const previous = series.length >= 2 ? series[series.length - 2] : null;

    // delta is in p.p. for percent/days/years KPIs, and in % change for number/currency KPIs.
    const isPP = k.format === 'percent' || k.format === 'days' || k.format === 'years';
    const delta = k.delta ?? 0;
    const eps = isPP ? 0.05 : 0.5;
    const direction = Math.abs(delta) < eps ? 'flat' : delta > 0 ? 'up' : 'down';
    const good = direction === 'flat' ? null : k.invertGood ? delta < 0 : delta > 0;

    let target = null;
    const tm = TARGET_MAP[k.key];
    if (t && tm) {
      const targetValue = tm.monthly ? t[tm.field] / 12 : t[tm.field];
      const ok = tm.lowerIsBetter ? current <= targetValue : current <= targetValue * 1.05;
      target = {
        value: targetValue,
        ratio: targetValue ? current / targetValue : 0,
        lowerIsBetter: tm.lowerIsBetter,
        monthly: tm.monthly,
        ok,
      };
    }

    return { key: k.key, label: k.label, format: k.format, current, previous, delta, isPP, direction, good, target };
  });
}
