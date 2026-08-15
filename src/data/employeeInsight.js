import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import { diffInYears } from '../utils/dates.js';
import { pick, txt } from '../i18n/lang.js';

// Deterministic, rule-based narrative — the reliable baseline shown while Gemini isn't
// configured (or as a fallback if the call fails). Mirrors the tone of copilotEngine.js.
export function buildLocalEmployeeInsight({ employee: e, riskEntry, referenceDate }) {
  const tenureYears = diffInYears(e.admissionDate, referenceDate);
  const first = e.name.split(' ')[0];
  const sentences = [];

  const tenureText = tenureYears < 1
    ? pick(`${first} está na empresa há menos de um ano`, `${first} has been with the company for less than a year`)
    : pick(`${first} está na empresa há ${formatNumber(tenureYears, 1)} anos`, `${first} has been with the company for ${formatNumber(tenureYears, 1)} years`);
  const hasManager = e.managerName && e.managerName !== 'A definir';
  const reportingPt = hasManager ? `, reportando para ${e.managerName}` : '';
  const reportingEn = hasManager ? `, reporting to ${e.managerName}` : '';
  sentences.push(pick(
    `${tenureText}, atuando como ${e.roleLevel} em ${e.area}${reportingPt}.`,
    `${tenureText}, working as ${e.roleLevel} in ${e.area}${reportingEn}.`,
  ));

  if (e.performanceBucket === 'Não avaliado') {
    sentences.push(pick(
      'Ainda não passou por um ciclo formal de avaliação de desempenho.',
      'Has not yet gone through a formal performance review cycle.',
    ));
  } else if (e.performanceBucket === 'Alto' && e.potential === 'Alto') {
    sentences.push(pick(
      'Está classificado(a) como **talento crítico** no Nine Box — alto desempenho combinado com alto potencial, prioridade para retenção e desenvolvimento acelerado.',
      'Classified as a **critical talent** in the Nine Box — high performance combined with high potential, a priority for retention and accelerated development.',
    ));
  } else if (e.performanceBucket === 'Baixo') {
    sentences.push(pick(
      'O desempenho no último ciclo ficou abaixo do esperado — recomenda-se plano de desenvolvimento individual (PDI) com metas claras e acompanhamento próximo do gestor.',
      'Performance in the last cycle fell below expectations — an individual development plan (IDP) with clear goals and close manager follow-up is recommended.',
    ));
  } else {
    sentences.push(pick(
      `Desempenho **${txt(e.performanceBucket).toLowerCase()}** com potencial **${txt(e.potential).toLowerCase()}** no ciclo mais recente.`,
      `**${txt(e.performanceBucket).toLowerCase()}** performance with **${txt(e.potential).toLowerCase()}** potential in the most recent cycle.`,
    ));
  }

  if (riskEntry) {
    const factorsPt = riskEntry.factors.slice(0, 2).map((f) => f.label.toLowerCase()).join(' e ');
    const factorsEn = riskEntry.factors.slice(0, 2).map((f) => f.label.toLowerCase()).join(' and ');
    const factorTextPt = riskEntry.factors.length ? ` Principais fatores: ${factorsPt}.` : '';
    const factorTextEn = riskEntry.factors.length ? ` Main factors: ${factorsEn}.` : '';
    const levelLc = txt(riskEntry.level).toLowerCase();
    if (riskEntry.level === 'Alto' || riskEntry.level === 'Muito Alto') {
      sentences.push(pick(
        `O modelo preditivo aponta risco **${levelLc}** de saída (score ${riskEntry.score}/100).${factorTextPt}`,
        `The predictive model indicates a **${levelLc}** attrition risk (score ${riskEntry.score}/100).${factorTextEn}`,
      ));
    } else {
      sentences.push(pick(
        `Risco de saída atual: **${levelLc}** (score ${riskEntry.score}/100).`,
        `Current attrition risk: **${levelLc}** (score ${riskEntry.score}/100).`,
      ));
    }
  }

  if (e.promotions === 0 && tenureYears > 3) {
    sentences.push(pick(
      `Sem promoções registradas em ${formatNumber(tenureYears, 0)} anos de casa — vale revisar o plano de carreira.`,
      `No promotions recorded in ${formatNumber(tenureYears, 0)} years at the company — worth reviewing the career plan.`,
    ));
  } else if (e.promotions > 0) {
    sentences.push(pick(
      `Já passou por ${e.promotions} promoção${e.promotions > 1 ? 'ões' : ''} desde a admissão.`,
      `Has had ${e.promotions} promotion${e.promotions > 1 ? 's' : ''} since being hired.`,
    ));
  }

  if (e.engagementScore < 55) {
    sentences.push(pick(
      `Engajamento abaixo da média (${formatPercent(e.engagementScore)}) — indicado para conversa 1:1 de escuta ativa.`,
      `Below-average engagement (${formatPercent(e.engagementScore)}) — recommended for a 1:1 active-listening conversation.`,
    ));
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
