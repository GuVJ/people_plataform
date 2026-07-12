import { formatCurrency, formatPercent, formatNumber } from '../utils/format.js';

function trendWord(delta) {
  return delta >= 0 ? 'aumentou' : 'reduziu';
}

export function generateInsights(metrics, forecasts) {
  const insights = [];
  const last = (arr) => arr[arr.length - 1];
  const prev = (arr) => arr[arr.length - 2];

  // Turnover driver: which area contributed most to the delta
  const turn = last(metrics.turnoverSeries);
  const turnPrev = prev(metrics.turnoverSeries);
  const turnDelta = turn.totalRate - turnPrev.totalRate;
  if (Math.abs(turnDelta) >= 0.15) {
    const topArea = [...metrics.headcountByArea].sort((a, b) => b.count - a.count)[0];
    insights.push({
      id: 'turnover-trend',
      type: turnDelta > 0 ? 'danger' : 'success',
      title: `Turnover ${trendWord(turnDelta)} ${formatPercent(Math.abs(turnDelta))} em relação ao mês anterior`,
      text: `A taxa de turnover mensal foi de ${formatPercent(turn.totalRate)} contra ${formatPercent(turnPrev.totalRate)} no mês anterior, puxada principalmente pela diretoria ${topArea?.area ?? '—'}.`,
      metric: 'turnover',
    });
  }

  // Overtime cost growth over last 3 months
  const otSeries = metrics.overtimeSeries;
  const ot3ago = otSeries[otSeries.length - 4] ?? otSeries[0];
  const otNow = last(otSeries);
  const otGrowth = otNow.cost - ot3ago.cost;
  if (Math.abs(otGrowth) >= 5000) {
    insights.push({
      id: 'overtime-cost',
      type: otGrowth > 0 ? 'warning' : 'success',
      title: `Custo de horas extras ${otGrowth > 0 ? 'cresceu' : 'caiu'} ${formatCurrency(Math.abs(otGrowth), { compact: true })} nos últimos 3 meses`,
      text: `O custo mensal de horas extras passou de ${formatCurrency(ot3ago.cost, { compact: true })} para ${formatCurrency(otNow.cost, { compact: true })}.`,
      metric: 'horasExtras',
    });
  }

  // Overload risk area (overtime cost + absenteeism combined)
  const overloadArea = [...metrics.overtimeByArea][0];
  if (overloadArea) {
    insights.push({
      id: 'overload-area',
      type: 'warning',
      title: `A diretoria ${overloadArea.area} apresenta o maior risco de sobrecarga`,
      text: `Responde por ${formatCurrency(overloadArea.cost, { compact: true })} em horas extras nos últimos 24 meses — o maior volume entre todas as diretorias monitoradas.`,
      metric: 'horasExtras',
    });
  }

  // Absenteeism forecast trend
  const absForecast = forecasts.find((f) => f.key === 'absenteismo');
  if (absForecast && absForecast.result.trendPct > 3) {
    insights.push({
      id: 'absenteeism-forecast',
      type: 'warning',
      title: 'Tendência indica aumento do absenteísmo nos próximos meses',
      text: `O modelo projeta absenteísmo de ${formatPercent(absForecast.result.forecast[absForecast.result.forecast.length - 1].y)} em ${absForecast.result.forecast[absForecast.result.forecast.length - 1].label}, ante ${formatPercent(absForecast.result.history[absForecast.result.history.length - 1].y)} no último mês fechado.`,
      metric: 'absenteismo',
    });
  }

  // Diversity in leadership gap
  const womenOverall = metrics.diversity.gender.find((g) => g.label === 'Feminino')?.pct ?? 0;
  const womenLeadership = metrics.diversity.leadershipGender.find((g) => g.label === 'Feminino')?.pct ?? 0;
  if (womenOverall - womenLeadership >= 8) {
    insights.push({
      id: 'diversity-leadership-gap',
      type: 'info',
      title: 'Mulheres estão sub-representadas em posições de liderança',
      text: `Mulheres representam ${formatPercent(womenOverall)} do quadro total, mas apenas ${formatPercent(womenLeadership)} das posições de liderança.`,
      metric: 'diversidade',
    });
  }

  // Turnover cost total (last 12 months)
  const last12Cost = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0);
  insights.push({
    id: 'turnover-cost-annual',
    type: 'info',
    title: `O turnover custou ${formatCurrency(last12Cost, { compact: true })} nos últimos 12 meses`,
    text: `Estimativa baseada em ${formatNumber(metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.total, 0))} desligamentos, considerando custo de reposição, ramp-up e perda de produtividade.`,
    metric: 'custoPessoal',
  });

  // Training ROI
  insights.push({
    id: 'training-roi',
    type: 'success',
    title: `Treinamentos geram R$ ${formatNumber(metrics.training.roiRatio, 2)} de retorno para cada R$ 1,00 investido`,
    text: `Investimento estimado de ${formatCurrency(metrics.training.trainingInvestment, { compact: true })} em capacitação no último ano, com ${formatPercent(metrics.training.completionPct)} de conclusão média.`,
    metric: 'treinamentos',
  });

  return insights.slice(0, 6);
}
