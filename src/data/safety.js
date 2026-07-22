import { createRng, gaussian } from './rng.js';
import { MONTH_LABELS, UNITS } from './constants.js';

// Dados de Segurança do Trabalho (SST), derivados de forma determinística do quadro ativo.
// Cobre inspeções, paralisações (e seus motivos), intervenções e indicadores de acidentes.

// Motivos de paralisação de atividade (embargo/interdição por risco iminente).
export const STOPPAGE_REASONS = [
  { key: 'altura', label: 'Trabalho em altura sem proteção', color: 'var(--chart-7)', weight: 24 },
  { key: 'eletrico', label: 'Risco elétrico', color: 'var(--chart-5)', weight: 18 },
  { key: 'epi', label: 'Falta / falha de EPI', color: 'var(--chart-1)', weight: 16 },
  { key: 'maquina', label: 'Máquina sem proteção', color: 'var(--chart-3)', weight: 14 },
  { key: 'quimico', label: 'Vazamento / produto químico', color: 'var(--chart-6)', weight: 11 },
  { key: 'confinado', label: 'Espaço confinado', color: 'var(--chart-4)', weight: 9 },
  { key: 'clima', label: 'Condição climática', color: 'var(--chart-8)', weight: 8 },
];

// Intervenções preventivas de SST.
export const INTERVENTIONS = [
  { key: 'dds', label: 'DDS (Diálogo Diário de Segurança)', color: 'var(--chart-1)' },
  { key: 'treino', label: 'Treinamentos de segurança (NRs)', color: 'var(--chart-3)' },
  { key: 'correcao', label: 'Correções de não-conformidade', color: 'var(--chart-4)' },
  { key: 'loto', label: 'Bloqueios LOTO (energia)', color: 'var(--chart-6)' },
  { key: 'epi', label: 'Entregas / trocas de EPI', color: 'var(--chart-5)' },
];

// Diretorias com exposição a risco físico (as demais são majoritariamente administrativas).
const AREA_RISK = {
  'Operações': 1.7,
  'Atendimento ao Cliente': 0.5,
  'Comercial': 0.4,
  'Tecnologia': 0.2,
  'Produto & Design': 0.2,
  'Financeiro': 0.15,
  'Marketing': 0.15,
  'Recursos Humanos': 0.15,
  'Jurídico': 0.1,
};

export function buildSafety(employees, months, referenceDate) {
  const rng = createRng(529117);
  const active = employees.filter((e) => e.status === 'Ativo');
  const activeCount = active.length || 1;

  // Exposição ao risco ponderada por diretoria (headcount × fator de risco).
  const areaCounts = {};
  for (const e of active) areaCounts[e.area] = (areaCounts[e.area] ?? 0) + 1;
  const exposure = {};
  let totalExposure = 0;
  for (const [area, count] of Object.entries(areaCounts)) {
    exposure[area] = count * (AREA_RISK[area] ?? 0.2);
    totalExposure += exposure[area];
  }
  const riskHeadcount = Math.round(totalExposure); // "equivalente exposto a risco"

  const last12 = months.slice(-12);

  // Séries mensais: inspeções, conformidade, incidentes (com/sem afastamento), paralisações.
  const inspectionSeries = [];
  const incidentSeries = [];
  const stoppageSeries = [];
  const conformitySeries = [];
  let accidentsLostTime12 = 0;
  let accidentsNoLostTime12 = 0;
  let lostDays12 = 0;
  let inspections12 = 0;
  let stoppages12 = 0;

  last12.forEach((m, mi) => {
    const monthIndexInYear = m.getMonth();
    const inspections = Math.max(0, Math.round(gaussian(rng, 42, 6)));
    // Conformidade melhora levemente ao longo do tempo (cultura de segurança amadurecendo).
    const conformity = Math.min(99, Math.max(70, gaussian(rng, 82 + (mi / 11) * 6, 3)));
    const incidents = Math.max(0, Math.round(gaussian(rng, riskHeadcount * 0.02 + 3, 2)));
    const lostTime = Math.max(0, Math.round(incidents * (0.28 - (mi / 11) * 0.08)));
    const noLostTime = Math.max(0, incidents - lostTime);
    const stoppages = Math.max(0, Math.round(gaussian(rng, 4.5 - (mi / 11) * 1.5, 1.4)));
    const lostDays = lostTime * Math.round(gaussian(rng, 12, 4));

    inspectionSeries.push({ label: MONTH_LABELS[monthIndexInYear], y: inspections });
    conformitySeries.push({ label: MONTH_LABELS[monthIndexInYear], y: Math.round(conformity * 10) / 10 });
    incidentSeries.push({
      label: MONTH_LABELS[monthIndexInYear],
      total: incidents,
      values: { lostTime, noLostTime },
    });
    stoppageSeries.push({ label: MONTH_LABELS[monthIndexInYear], y: stoppages });

    accidentsLostTime12 += lostTime;
    accidentsNoLostTime12 += noLostTime;
    lostDays12 += lostDays;
    inspections12 += inspections;
    stoppages12 += stoppages;
  });

  // Paralisações por motivo (distribui o total dos 12 meses pelos pesos).
  const stoppagesByReason = STOPPAGE_REASONS.map((r) => {
    const totalW = STOPPAGE_REASONS.reduce((s, x) => s + x.weight, 0);
    const count = Math.round(stoppages12 * (r.weight / totalW) * (0.9 + rng() * 0.2));
    return { key: r.key, label: r.label, color: r.color, value: count };
  }).sort((a, b) => b.value - a.value);

  // Intervenções preventivas (volumes anuais).
  const interventionBase = { dds: 240, treino: 96, correcao: 180, loto: 320, epi: 540 };
  const interventions = INTERVENTIONS.map((it) => ({
    key: it.key,
    label: it.label,
    color: it.color,
    value: Math.round(interventionBase[it.key] * (0.9 + rng() * 0.25) * (riskHeadcount / 300)),
  })).sort((a, b) => b.value - a.value);

  // Heatmap de acidentes por diretoria × tipo (com/sem afastamento).
  const heatCols = [
    { key: 'lostTime', label: 'C/ afast.' },
    { key: 'noLostTime', label: 'S/ afast.' },
    { key: 'stoppage', label: 'Paralis.' },
  ];
  const heatRows = Object.keys(exposure)
    .map((area) => {
      const share = exposure[area] / totalExposure;
      const lt = Math.round(accidentsLostTime12 * share * (0.9 + rng() * 0.2));
      const nlt = Math.round(accidentsNoLostTime12 * share * (0.9 + rng() * 0.2));
      const st = Math.round(stoppages12 * share * (0.9 + rng() * 0.2));
      return { label: area, values: { lostTime: lt, noLostTime: nlt, stoppage: st }, total: lt + nlt + st };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  // Indicadores de acidentes (padrão SST).
  // Taxa de Frequência (TF) = acidentes com afastamento × 1.000.000 / HHT (homem-hora trabalhada).
  // Taxa de Gravidade (TG) = dias perdidos × 1.000.000 / HHT.
  const hht = activeCount * 220 * 8; // ~220 dias úteis/ano × 8h
  const tf = (accidentsLostTime12 * 1_000_000) / hht;
  const tg = (lostDays12 * 1_000_000) / hht;

  // Dias sem acidente com afastamento (desde o último registro).
  const daysWithoutAccident = Math.round(gaussian(rng, 47, 12));
  const recordDays = Math.max(daysWithoutAccident + randInt(rng, 40, 120), 96);

  const lastInsp = inspectionSeries[inspectionSeries.length - 1];
  const prevInsp = inspectionSeries[inspectionSeries.length - 2] ?? lastInsp;
  const lastConf = conformitySeries[conformitySeries.length - 1];

  return {
    activeCount,
    riskHeadcount,
    inspectionSeries,
    conformitySeries,
    incidentSeries,
    stoppageSeries,
    stoppagesByReason,
    interventions,
    heatmap: { rows: heatRows, cols: heatCols },
    kpis: {
      daysWithoutAccident,
      recordDays,
      tf: Math.round(tf * 10) / 10,
      tg: Math.round(tg),
      inspecoesMes: lastInsp.y,
      inspecoesMesDelta: lastInsp.y - prevInsp.y,
      conformidade: lastConf.y,
      acidentesComAfast12: accidentsLostTime12,
      acidentesSemAfast12: accidentsNoLostTime12,
      paralisacoes12: stoppages12,
      diasPerdidos12: lostDays12,
    },
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
