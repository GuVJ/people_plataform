import { formatNumber, formatPercent } from '../utils/format.js';
import { pick } from '../i18n/lang.js';

export function buildLocalManagerInsight(view) {
  const { manager, headcount, turnoverRate, avgEngagement, avgAbsenceDays, highRisk, criticalTalents } = view;
  const first = manager.name.split(' ')[0];
  const sentences = [];

  sentences.push(pick(
    `O time de **${first}** tem ${headcount} colaborador${headcount !== 1 ? 'es' : ''} ativo${headcount !== 1 ? 's' : ''}, com engajamento médio de ${formatPercent(avgEngagement)}.`,
    `**${first}**'s team has ${headcount} active employee${headcount !== 1 ? 's' : ''}, with an average engagement of ${formatPercent(avgEngagement)}.`,
  ));

  if (turnoverRate >= 15) {
    sentences.push(pick(
      `O turnover do time nos últimos 12 meses está alto (${formatPercent(turnoverRate)}) — vale investigar causas em conjunto com o RH.`,
      `The team's turnover over the last 12 months is high (${formatPercent(turnoverRate)}) — worth investigating the causes together with HR.`,
    ));
  } else if (turnoverRate > 0) {
    sentences.push(pick(
      `Turnover do time nos últimos 12 meses: ${formatPercent(turnoverRate)}.`,
      `Team turnover over the last 12 months: ${formatPercent(turnoverRate)}.`,
    ));
  }

  if (highRisk.length > 0) {
    sentences.push(pick(
      `${highRisk.length} colaborador${highRisk.length !== 1 ? 'es estão' : ' está'} com risco alto ou muito alto de saída — priorize conversas 1:1 com essas pessoas.`,
      `${highRisk.length} employee${highRisk.length !== 1 ? 's are' : ' is'} at high or very high attrition risk — prioritize 1:1 conversations with them.`,
    ));
  }

  if (criticalTalents.length > 0) {
    sentences.push(pick(
      `${criticalTalents.length} talento${criticalTalents.length !== 1 ? 's críticos identificados' : ' crítico identificado'} (alto desempenho + alto potencial) — foco em retenção e desenvolvimento acelerado.`,
      `${criticalTalents.length} critical talent${criticalTalents.length !== 1 ? 's' : ''} identified (high performance + high potential) — focus on retention and accelerated development.`,
    ));
  }

  if (avgAbsenceDays >= 1.5) {
    sentences.push(pick(
      `Absenteísmo médio recente de ${formatNumber(avgAbsenceDays, 1)} dias/mês por pessoa está acima do ideal.`,
      `Recent average absenteeism of ${formatNumber(avgAbsenceDays, 1)} days/month per person is above the ideal.`,
    ));
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
