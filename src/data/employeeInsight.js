import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import { diffInYears } from '../utils/dates.js';

// Deterministic, rule-based narrative — the reliable baseline shown while Gemini isn't
// configured (or as a fallback if the call fails). Mirrors the tone of copilotEngine.js.
export function buildLocalEmployeeInsight({ employee: e, riskEntry, referenceDate }) {
  const tenureYears = diffInYears(e.admissionDate, referenceDate);
  const sentences = [];

  const tenureText = tenureYears < 1
    ? `${e.name.split(' ')[0]} está na empresa há menos de um ano`
    : `${e.name.split(' ')[0]} está na empresa há ${formatNumber(tenureYears, 1)} anos`;
  sentences.push(`${tenureText}, atuando como ${e.roleLevel} em ${e.area}${e.managerName && e.managerName !== 'A definir' ? `, reportando para ${e.managerName}` : ''}.`);

  if (e.performanceBucket === 'Não avaliado') {
    sentences.push('Ainda não passou por um ciclo formal de avaliação de desempenho.');
  } else if (e.performanceBucket === 'Alto' && e.potential === 'Alto') {
    sentences.push('Está classificado(a) como **talento crítico** no Nine Box — alto desempenho combinado com alto potencial, prioridade para retenção e desenvolvimento acelerado.');
  } else if (e.performanceBucket === 'Baixo') {
    sentences.push('O desempenho no último ciclo ficou abaixo do esperado — recomenda-se plano de desenvolvimento individual (PDI) com metas claras e acompanhamento próximo do gestor.');
  } else {
    sentences.push(`Desempenho **${e.performanceBucket.toLowerCase()}** com potencial **${e.potential.toLowerCase()}** no ciclo mais recente.`);
  }

  if (riskEntry) {
    const factorText = riskEntry.factors.length
      ? ` Principais fatores: ${riskEntry.factors.slice(0, 2).map((f) => f.label.toLowerCase()).join(' e ')}.`
      : '';
    if (riskEntry.level === 'Alto' || riskEntry.level === 'Muito Alto') {
      sentences.push(`O modelo preditivo aponta risco **${riskEntry.level.toLowerCase()}** de saída (score ${riskEntry.score}/100).${factorText}`);
    } else {
      sentences.push(`Risco de saída atual: **${riskEntry.level.toLowerCase()}** (score ${riskEntry.score}/100).`);
    }
  }

  if (e.promotions === 0 && tenureYears > 3) {
    sentences.push(`Sem promoções registradas em ${formatNumber(tenureYears, 0)} anos de casa — vale revisar o plano de carreira.`);
  } else if (e.promotions > 0) {
    sentences.push(`Já passou por ${e.promotions} promoção${e.promotions > 1 ? 'ões' : ''} desde a admissão.`);
  }

  if (e.engagementScore < 55) {
    sentences.push(`Engajamento abaixo da média (${formatPercent(e.engagementScore)}) — indicado para conversa 1:1 de escuta ativa.`);
  }

  return { text: sentences.join(' ') };
}

export function buildEmployeeCopilotContext({ employee: e, riskEntry, metrics, referenceDate }) {
  const tenureYears = diffInYears(e.admissionDate, referenceDate);
  const areaMedian = metrics.headcountByArea.find((a) => a.area === e.area);

  return {
    nome: e.name,
    area: e.area,
    cargo: e.roleLevel,
    gestor: e.managerName,
    unidade: e.unit,
    tempoDeCasaAnos: formatNumber(tenureYears, 1),
    salario: formatCurrency(e.salary, { compact: true }),
    desempenho: e.performanceBucket,
    potencial: e.potential,
    engajamento: formatPercent(e.engagementScore),
    climaOrganizacional: formatNumber(e.climateScore, 1),
    promocoes: e.promotions,
    treinamentosConcluidos: e.trainingsCompleted,
    horasTreinamentoAno: e.trainingHoursYear,
    beneficios: e.benefits,
    riscoDeSaida: riskEntry ? { score: riskEntry.score, nivel: riskEntry.level, fatores: riskEntry.factors.map((f) => f.label) } : null,
    headcountDaArea: areaMedian?.count ?? null,
  };
}
