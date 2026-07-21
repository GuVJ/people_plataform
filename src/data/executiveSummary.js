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

// YTD (year-to-date) only makes sense for flow/accumulation metrics — counts and costs that
// pile up over the year, plus turnover which accumulates as a rate. Stock/point-in-time
// metrics (headcount level, average tenure, women %) get no YTD.
const YTD_SUM = {
  admissoes: { series: 'admissionsSeries', valueKey: 'total' },
  desligamentos: { series: 'terminationsSeries', valueKey: 'total' },
  horasExtras: { series: 'overtimeSeries', valueKey: 'cost' },
  custoPessoal: { series: 'payrollSeries', valueKey: 'total' },
};

function ytdSumForYear(series, valueKey, year, refMonth) {
  return series
    .filter((p) => {
      const d = new Date(p.month);
      return d.getFullYear() === year && d.getMonth() <= refMonth;
    })
    .reduce((s, p) => s + p[valueKey], 0);
}

function headcountAtYearStart(headcountSeries, year) {
  const dec = headcountSeries.find((p) => {
    const d = new Date(p.month);
    return d.getFullYear() === year - 1 && d.getMonth() === 11;
  });
  if (dec) return dec.total;
  const jan = headcountSeries.find((p) => {
    const d = new Date(p.month);
    return d.getFullYear() === year && d.getMonth() === 0;
  });
  return jan?.total ?? null;
}

function turnoverYtdForYear(metrics, year, refMonth) {
  const terminations = ytdSumForYear(metrics.terminationsSeries, 'total', year, refMonth);
  const start = headcountAtYearStart(metrics.headcountSeries, year);
  if (!start) return null;
  return (terminations / start) * 100;
}

function buildYtd(k, metrics, refYear, refMonth) {
  let current = null;
  let previous = null;

  if (k.key === 'turnover') {
    current = turnoverYtdForYear(metrics, refYear, refMonth);
    previous = turnoverYtdForYear(metrics, refYear - 1, refMonth);
  } else if (YTD_SUM[k.key]) {
    const { series, valueKey } = YTD_SUM[k.key];
    current = ytdSumForYear(metrics[series], valueKey, refYear, refMonth);
    previous = ytdSumForYear(metrics[series], valueKey, refYear - 1, refMonth);
  } else {
    return null;
  }

  if (current === null || previous === null) return null;

  const isPP = k.key === 'turnover'; // turnover YTD is itself a %, compared in p.p.
  const delta = isPP ? current - previous : previous ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
  const eps = isPP ? 0.05 : 0.5;
  const direction = Math.abs(delta) < eps ? 'flat' : delta > 0 ? 'up' : 'down';
  const good = direction === 'flat' ? null : k.invertGood ? delta < 0 : delta > 0;

  return { current, previous, delta, isPP, direction, good, format: k.format };
}

export function buildExecutiveSummary(metrics, targets) {
  const t = targets ? targets[2026] : null;
  const refDate = new Date(metrics.months[metrics.months.length - 1]);
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();

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

    const ytd = buildYtd(k, metrics, refYear, refMonth);

    return { key: k.key, label: k.label, format: k.format, current, previous, delta, isPP, direction, good, target, ytd };
  });
}
