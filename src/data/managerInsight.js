import { formatNumber, formatPercent } from '../utils/format.js';

export function buildLocalManagerInsight(view) {
  const { manager, headcount, turnoverRate, avgEngagement, avgAbsenceDays, highRisk, criticalTalents } = view;
  const sentences = [];

  sentences.push(`O time de **${manager.name.split(' ')[0]}** tem ${headcount} colaborador${headcount !== 1 ? 'es' : ''} ativo${headcount !== 1 ? 's' : ''}, com engajamento médio de ${formatPercent(avgEngagement)}.`);

  if (turnoverRate >= 15) {
    sentences.push(`O turnover do time nos últimos 12 meses está alto (${formatPercent(turnoverRate)}) — vale investigar causas em conjunto com o RH.`);
  } else if (turnoverRate > 0) {
    sentences.push(`Turnover do time nos últimos 12 meses: ${formatPercent(turnoverRate)}.`);
  }

  if (highRisk.length > 0) {
    sentences.push(`${highRisk.length} colaborador${highRisk.length !== 1 ? 'es estão' : ' está'} com risco alto ou muito alto de saída — priorize conversas 1:1 com essas pessoas.`);
  }

  if (criticalTalents.length > 0) {
    sentences.push(`${criticalTalents.length} talento${criticalTalents.length !== 1 ? 's críticos identificados' : ' crítico identificado'} (alto desempenho + alto potencial) — foco em retenção e desenvolvimento acelerado.`);
  }

  if (avgAbsenceDays >= 1.5) {
    sentences.push(`Absenteísmo médio recente de ${formatNumber(avgAbsenceDays, 1)} dias/mês por pessoa está acima do ideal.`);
  }

  return { text: sentences.join(' ') };
}

export function buildManagerCopilotContext(view) {
  const { manager, headcount, turnoverRate, avgEngagement, avgClimate, avgAbsenceDays, avgOvertimeHours, avgTenureYears, performanceDistribution, riskDistribution, criticalTalents, promotionsCount, avgTrainingHours } = view;
  return {
    gestor: manager.name,
    area: manager.area,
    tamanhoDoTime: headcount,
    turnoverTime12m: formatPercent(turnoverRate),
    engajamentoMedio: formatPercent(avgEngagement),
    climaMedio: formatNumber(avgClimate, 1),
    absenteismoMedioDiasMes: formatNumber(avgAbsenceDays, 1),
    horasExtrasMediaMes: formatNumber(avgOvertimeHours, 1),
    tempoDeCasaMedioAnos: formatNumber(avgTenureYears, 1),
    distribuicaoDesempenho: performanceDistribution,
    distribuicaoRisco: riskDistribution,
    talentosCriticos: criticalTalents.length,
    promocoesNoTime: promotionsCount,
    horasTreinamentoMediaAno: formatNumber(avgTrainingHours, 1),
  };
}
