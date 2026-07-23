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
export function buildCopilotContext({ metrics, insights, risk, medical, safety }) {
  const last = (arr) => arr[arr.length - 1];
  const prev = (arr) => arr[arr.length - 2];

  const riskCounts = ['Baixo', 'Médio', 'Alto', 'Muito Alto'].reduce((acc, level) => {
    acc[level] = risk.filter((r) => r.level === level).length;
    return acc;
  }, {});

  // Tabela unificada por diretoria — junta headcount, turnover, desligamentos e custo de horas
  // extras num mesmo objeto, para o modelo conseguir CRUZAR métricas (ex.: correlacionar
  // turnover alto com horas extras altas) sem precisar casar tabelas separadas.
  const byArea = new Map();
  const ensure = (area) => {
    if (!byArea.has(area)) byArea.set(area, { diretoria: area });
    return byArea.get(area);
  };
  metrics.headcountByArea.forEach((a) => { ensure(a.area).headcount = a.count; });
  metrics.turnoverByArea.forEach((a) => {
    const row = ensure(a.area);
    row.turnover12m = formatPercent(a.rate);
    row.turnoverNum = Math.round(a.rate * 10) / 10;
    row.desligamentos12m = a.count;
  });
  metrics.overtimeByArea.forEach((a) => {
    const row = ensure(a.area);
    row.custoHorasExtras12m = formatCurrency(a.cost, { compact: true });
    row.custoHorasExtrasNum = Math.round(a.cost);
  });
  const diretorias = [...byArea.values()].sort((a, b) => (b.turnoverNum ?? 0) - (a.turnoverNum ?? 0));

  const turnAtual = last(metrics.turnoverSeries);
  const turnPrev = prev(metrics.turnoverSeries);
  const absAtual = last(metrics.absenteeismSeries);

  return {
    periodoFechado: metrics.labels.at(-1),
    headcountAtivo: metrics.activeNow.length,
    kpis: metrics.kpis.map((k) => ({ indicador: k.label, valor: formatKpi(k) })),
    // Visão consolidada por diretoria (use esta tabela para comparar/correlacionar métricas).
    diretorias,
    tendencias: {
      turnoverMesAtual: formatPercent(turnAtual.totalRate),
      turnoverMesAnterior: formatPercent(turnPrev.totalRate),
      turnoverDirecao: turnAtual.totalRate >= turnPrev.totalRate ? 'alta' : 'queda',
      absenteismoMesAtual: formatPercent(absAtual.rate),
    },
    custos: {
      folhaMensal: formatCurrency(last(metrics.payrollSeries).total, { compact: true }),
      custoTurnover12m: formatCurrency(metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0), { compact: true }),
      custoHorasExtras12m: formatCurrency(metrics.overtimeSeries.slice(-12).reduce((s, o) => s + o.cost, 0), { compact: true }),
    },
    motivosDesligamento: metrics.terminationReasons.slice(0, 5).map((r) => ({ motivo: r.reason, quantidade: r.count })),
    absenteismoPorMotivo: metrics.absenteeismByReason.slice(0, 5).map((r) => ({ motivo: r.reason, dias: r.days })),
    atestados: medical ? {
      atestadosMes: medical.kpis.atestadosMes,
      diasPerdidosMes: medical.kpis.diasMes,
      saudeMentalPctCID_F: formatPercent(medical.kpis.pctMental),
      afastamentosMais15diasINSS: medical.kpis.inss15,
      principaisGruposCID: medical.groups.slice(0, 4).map((g) => ({ grupo: g.label, atestados: g.count })),
    } : undefined,
    seguranca: safety ? {
      diasSemAcidente: safety.kpis.daysWithoutAccident,
      taxaFrequenciaTF: safety.kpis.tf,
      taxaGravidadeTG: safety.kpis.tg,
      acidentesComAfastamento12m: safety.kpis.acidentesComAfast12,
      paralisacoes12m: safety.kpis.paralisacoes12,
      conformidadeInspecoes: formatPercent(safety.kpis.conformidade),
      principalMotivoParalisacao: safety.stoppagesByReason[0]?.label,
    } : undefined,
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
