import { linearRegression, average } from '../utils/stats.js';
import { addMonths, monthLabel } from '../utils/dates.js';

// Fits a linear trend to the last `window` points and projects `monthsAhead` forward.
// Returns {history: [{x,y,label}], forecast: [{x,y,label,low,high}]}
export function forecastSeries(series, valueKey, { window = 9, monthsAhead = 3 } = {}) {
  const tail = series.slice(-window);
  const points = tail.map((p, i) => ({ x: i, y: p[valueKey] }));
  const { slope, intercept, predict } = linearRegression(points);

  const residuals = points.map((p) => p.y - predict(p.x));
  const stdError = Math.sqrt(average(residuals.map((r) => r * r))) || average(points, (p) => p.y) * 0.08;

  const lastMonth = series[series.length - 1].month;
  const forecast = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const x = points.length - 1 + i;
    const y = Math.max(0, predict(x));
    const spread = stdError * (1 + i * 0.35);
    const month = addMonths(lastMonth, i);
    forecast.push({ month, label: monthLabel(month), y, low: Math.max(0, y - spread), high: y + spread });
  }

  return {
    slope,
    trendPct: points.length > 1 && points[0].y !== 0 ? ((predict(points.length - 1) - predict(0)) / Math.abs(points[0].y)) * 100 : 0,
    history: tail.map((p, i) => ({ month: p.month, label: p.label, y: p[valueKey] })),
    forecast,
  };
}

export const FORECAST_METRICS = [
  { key: 'turnover', label: 'Turnover mensal', series: 'turnoverSeries', valueKey: 'totalRate', format: 'percent' },
  { key: 'absenteismo', label: 'Absenteísmo', series: 'absenteeismSeries', valueKey: 'rate', format: 'percent' },
  { key: 'headcount', label: 'Headcount', series: 'headcountSeries', valueKey: 'total', format: 'number' },
  { key: 'custoPessoal', label: 'Custo de pessoal', series: 'payrollSeries', valueKey: 'total', format: 'currency' },
  { key: 'horasExtras', label: 'Custo de horas extras', series: 'overtimeSeries', valueKey: 'cost', format: 'currency' },
  { key: 'admissoes', label: 'Admissões', series: 'admissionsSeries', valueKey: 'total', format: 'number' },
  { key: 'desligamentos', label: 'Desligamentos', series: 'terminationsSeries', valueKey: 'total', format: 'number' },
];

export function buildAllForecasts(metrics) {
  return FORECAST_METRICS.map((m) => ({
    ...m,
    result: forecastSeries(metrics[m.series], m.valueKey),
  }));
}
