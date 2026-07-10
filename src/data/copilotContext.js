import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

function formatKpi(k) {
  if (k.format === 'currency') return formatCurrency(k.value, { compact: true });
  if (k.format === 'percent') return formatPercent(k.value);
  if (k.format === 'days') return `${formatNumber(k.value, 0)} dias`;
  if (k.format === 'years') return `${formatNumber(k.value, 1)} anos`;
  return formatNumber(k.value);
}

// Builds a small, JSON-safe snapshot of the current dataset — grounding data for the
// Gemini prompt. Deliberately compact: never send the full employee list (thousands of
// records) to the model, only pre-aggregated numbers it can quote back accurately.
export function buildCopilotContext({ metrics, insights, risk }) {
  const last = (arr) => arr[arr.length - 1];

  const riskCounts = ['Baixo', 'Médio', 'Alto', 'Muito Alto'].reduce((acc, level) => {
    acc[level] = risk.filter((r) => r.level === level).length;
    return acc;
  }, {});

  return {
    periodoFechado: metrics.labels.at(-1),
    headcountAtivo: metrics.activeNow.length,
    kpis: metrics.kpis.map((k) => ({ indicador: k.label, valor: formatKpi(k) })),
    turnoverPorArea: metrics.turnoverByArea.slice(0, 6).map((a) => ({ area: a.area, taxa: formatPercent(a.rate), desligamentos12m: a.count })),
    motivosDesligamento: metrics.terminationReasons.slice(0, 5).map((r) => ({ motivo: r.reason, quantidade: r.count })),
    absenteismoPorMotivo: metrics.absenteeismByReason.slice(0, 5).map((r) => ({ motivo: r.reason, dias: r.days })),
    horasExtrasPorArea: metrics.overtimeByArea.slice(0, 5).map((a) => ({ area: a.area, custoEstimado: formatCurrency(a.cost, { compact: true }) })),
    diversidade: {
      mulheresQuadro: formatPercent(metrics.diversity.gender.find((g) => g.label === 'Feminino')?.pct ?? 0),
      mulheresLideranca: formatPercent(metrics.diversity.leadershipGender.find((g) => g.label === 'Feminino')?.pct ?? 0),
      pcd: formatPercent(metrics.diversity.pcdPct),
    },
    treinamento: {
      horasPorColaborador: formatNumber(metrics.training.hoursPerEmployee, 1),
      conclusaoMedia: formatPercent(metrics.training.completionPct),
      roiPorReal: formatNumber(metrics.training.roiRatio, 2),
    },
    recrutamento: {
      tempoMedioContratacaoDias: formatNumber(metrics.recruitment.avgTimeToHireDaysCurrent, 0),
      slaPct: formatPercent(metrics.recruitment.slaPct),
    },
    riscoDeSaida: {
      distribuicao: riskCounts,
      top5MaiorRisco: risk.slice(0, 5).map((r) => ({ area: r.area, gestor: r.managerName, score: r.score, nivel: r.level })),
    },
    insightsDoPeriodo: insights.map((i) => i.title),
    benchmarkMercado: {
      turnoverMensal: formatPercent(metrics.benchmark.turnoverMonthly),
      absenteismo: formatPercent(metrics.benchmark.absenteeismRate),
    },
  };
}
