export const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function bucketByYear(series, valueKey) {
  const years = {};
  for (const point of series) {
    const d = new Date(point.month);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (!years[y]) years[y] = Array(12).fill(null);
    years[y][m] = point[valueKey];
  }
  return years;
}

function cumulative(monthly) {
  let sum = 0;
  return monthly.map((v) => {
    if (v === null || v === undefined) return null;
    sum += v;
    return sum;
  });
}

function yearPair(byYear, years, transform = (v) => v) {
  const out = {};
  for (const y of years) {
    out[y] = transform(byYear[y] ?? Array(12).fill(null));
  }
  return out;
}

// Straight-line pro-rated budget reference: 0 in December of the prior year, reaching the
// full annual target by December — the standard "are we pacing on budget" comparison line.
export function buildRampTarget(annualTarget) {
  return Array.from({ length: 12 }, (_, i) => (annualTarget / 12) * (i + 1));
}

export function buildFlatTarget(target) {
  return Array.from({ length: 12 }, () => target);
}

export function buildYearComparison(metrics, years = [2025, 2026]) {
  const headcountByYear = bucketByYear(metrics.headcountSeries, 'total');
  const payrollByYear = bucketByYear(metrics.payrollSeries, 'total');
  const overtimeByYear = bucketByYear(metrics.overtimeSeries, 'cost');
  const terminationCountByYear = bucketByYear(metrics.terminationsSeries, 'total');

  const headcount = yearPair(headcountByYear, years);
  const peopleCostCumulative = yearPair(payrollByYear, years, cumulative);
  const overtimeCostCumulative = yearPair(overtimeByYear, years, cumulative);

  const turnoverCumulativePct = {};
  for (const y of years) {
    const startHeadcount = headcountByYear[y - 1]?.[11] ?? headcountByYear[y]?.[0] ?? 1;
    const monthly = terminationCountByYear[y] ?? Array(12).fill(null);
    let cum = 0;
    turnoverCumulativePct[y] = monthly.map((v) => {
      if (v === null || v === undefined) return null;
      cum += v;
      return (cum / (startHeadcount || 1)) * 100;
    });
  }

  const lastCompleteIndex = (arr) => {
    let idx = -1;
    arr.forEach((v, i) => { if (v !== null && v !== undefined) idx = i; });
    return idx;
  };

  return {
    monthLabels: MONTH_NAMES,
    headcount,
    peopleCostCumulative,
    overtimeCostCumulative,
    turnoverCumulativePct,
    years,
    lastCompleteIndex,
  };
}
