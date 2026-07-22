import { createRng, gaussian } from './rng.js';
import { MONTH_LABELS } from './constants.js';

// Dados de atestados médicos por grupo de CID-10, derivados de forma determinística do quadro
// ativo. Não altera o employee base — é uma camada agregada (como deriveMetrics), computada a
// partir dos funcionários e dos meses de histórico.

export const CID_GROUPS = [
  { key: 'J', code: 'J00–J99', label: 'Respiratórias', color: 'var(--chart-1)', weight: 22, avgDays: 2.6, seasonal: 'winter' },
  { key: 'M', code: 'M00–M99', label: 'Osteomusculares', color: 'var(--chart-3)', weight: 18, avgDays: 5.4 },
  { key: 'F', code: 'F00–F99', label: 'Saúde mental', color: 'var(--chart-6)', weight: 15, avgDays: 8.2, trend: 'rising' },
  { key: 'A', code: 'A00–B99', label: 'Infecciosas', color: 'var(--chart-4)', weight: 11, avgDays: 4.1, seasonal: 'summer' },
  { key: 'K', code: 'K00–K93', label: 'Digestivas', color: 'var(--chart-5)', weight: 8, avgDays: 3.0 },
  { key: 'S', code: 'S00–T98', label: 'Lesões/Acidentes', color: 'var(--chart-7)', weight: 8, avgDays: 9.8 },
  { key: 'R', code: 'R00–R99', label: 'Sintomas mal definidos', color: 'var(--chart-8)', weight: 7, avgDays: 2.2 },
  { key: 'O', code: 'O00–O99', label: 'Gestação/Parto', color: 'var(--chart-2)', weight: 6, avgDays: 14 },
  { key: 'I', code: 'I00–I99', label: 'Circulatórias', color: '#DB2777', weight: 3, avgDays: 7.5 },
  { key: 'Z', code: 'Z00–Z99', label: 'Outros/Exames', color: '#9CA3AF', weight: 2, avgDays: 1.6 },
];

const GROUP_BY_KEY = Object.fromEntries(CID_GROUPS.map((g) => [g.key, g]));

// Viés por diretoria: onde cada tipo de atestado se concentra (área operacional puxa
// osteomuscular/lesão, áreas de pressão puxam saúde mental, etc.).
const AREA_BIAS = {
  'Operações': { M: 1.6, S: 1.8, J: 1.1, F: 0.7 },
  'Atendimento ao Cliente': { F: 1.6, J: 1.2, R: 1.3, M: 1.1 },
  'Tecnologia': { F: 1.4, M: 1.3, J: 0.8 },
  'Comercial': { F: 1.3, I: 1.2, K: 1.1 },
  'Financeiro': { F: 1.1, I: 1.1 },
  'Marketing': { F: 1.2 },
  'Recursos Humanos': { F: 1.1 },
  'Jurídico': { F: 1.1, I: 1.1 },
  'Produto & Design': { F: 1.3, M: 1.2 },
};

// CIDs específicos mais frequentes, para a tabela de detalhe.
const TOP_CID_CODES = [
  { code: 'J06', label: 'Infecção via aérea superior (IVAS)', group: 'J', share: 0.13 },
  { code: 'M54.5', label: 'Dor lombar baixa (lombalgia)', group: 'M', share: 0.10 },
  { code: 'F41.1', label: 'Transtorno de ansiedade generalizada', group: 'F', share: 0.08 },
  { code: 'J11', label: 'Influenza (gripe)', group: 'J', share: 0.07 },
  { code: 'F32', label: 'Episódio depressivo', group: 'F', share: 0.06 },
  { code: 'A90', label: 'Dengue', group: 'A', share: 0.05 },
  { code: 'M75', label: 'Lesão do ombro', group: 'M', share: 0.05 },
  { code: 'Z76.3', label: 'Acompanhante / licença', group: 'Z', share: 0.04 },
  { code: 'K52', label: 'Gastroenterite não infecciosa', group: 'K', share: 0.04 },
  { code: 'R51', label: 'Cefaleia (enxaqueca)', group: 'R', share: 0.04 },
  { code: 'F43.2', label: 'Transtorno de adaptação (estresse)', group: 'F', share: 0.035 },
  { code: 'S93', label: 'Entorse de tornozelo', group: 'S', share: 0.03 },
];

function seasonalFactor(kind, monthIndexInYear) {
  const winter = [5, 6, 7].includes(monthIndexInYear); // Jun–Ago
  const summer = [11, 0, 1, 2].includes(monthIndexInYear); // Dez–Mar
  if (kind === 'winter') return winter ? 1.6 : summer ? 0.8 : 1;
  if (kind === 'summer') return summer ? 1.7 : winter ? 0.75 : 1;
  return 1;
}

export function buildMedicalLeave(employees, months) {
  const rng = createRng(778201);
  const active = employees.filter((e) => e.status === 'Ativo');
  const activeCount = active.length || 1;

  const areaCounts = {};
  for (const e of active) areaCounts[e.area] = (areaCounts[e.area] ?? 0) + 1;
  const areas = Object.keys(areaCounts).sort((a, b) => areaCounts[b] - areaCounts[a]);

  const last12 = months.slice(-12);

  // Série mensal por grupo de CID.
  const monthlyByCid = [];
  const totalsByGroup = Object.fromEntries(CID_GROUPS.map((g) => [g.key, 0]));

  last12.forEach((m, mi) => {
    const monthIndexInYear = m.getMonth();
    const trendBoost = 1; // aplicado por grupo abaixo
    const baseTotal = activeCount * 0.055 * (0.9 + rng() * 0.25);
    const values = {};
    let total = 0;
    for (const g of CID_GROUPS) {
      const season = seasonalFactor(g.seasonal, monthIndexInYear);
      const rising = g.trend === 'rising' ? 0.72 + (mi / 11) * 0.7 : 1;
      const share = (g.weight / 100) * season * rising;
      const count = Math.max(0, Math.round(baseTotal * share * (0.85 + rng() * 0.3)));
      if (count > 0) {
        values[g.key] = count;
        total += count;
        totalsByGroup[g.key] += count;
      }
    }
    monthlyByCid.push({ label: MONTH_LABELS[monthIndexInYear], total, values });
  });

  const total12 = Object.values(totalsByGroup).reduce((s, v) => s + v, 0) || 1;

  // Grupos ordenados por volume (para donut / legenda / heatmap).
  const groups = CID_GROUPS
    .map((g) => {
      const count = totalsByGroup[g.key];
      const days = Math.round(count * g.avgDays);
      return { ...g, count, days, avgDays: g.avgDays, pct: (count / total12) * 100 };
    })
    .sort((a, b) => b.count - a.count);

  // Heatmap: diretoria × grupo de CID (top 6 grupos).
  const heatCols = groups.slice(0, 6).map((g) => ({ key: g.key, label: g.key }));
  const heatRows = areas.map((area) => {
    const headShare = areaCounts[area] / activeCount;
    const bias = AREA_BIAS[area] ?? {};
    const rowValues = {};
    let rowTotal = 0;
    for (const col of heatCols) {
      const groupTotal = totalsByGroup[col.key];
      const raw = groupTotal * headShare * (bias[col.key] ?? 1) * (0.9 + rng() * 0.2);
      const v = Math.round(raw);
      rowValues[col.key] = v;
      rowTotal += v;
    }
    return { label: area, values: rowValues, total: rowTotal };
  }).sort((a, b) => b.total - a.total);

  // Tendência de saúde mental (participação % do grupo F ao longo dos 12 meses).
  const mentalHealthTrend = monthlyByCid.map((m) => ({
    label: m.label,
    y: m.total ? ((m.values.F ?? 0) / m.total) * 100 : 0,
  }));

  // Faixas de duração (dias de afastamento). >15 dias = afastamento previdenciário (INSS).
  const durationDist = [
    { label: '1 dia', frac: 0.34, color: 'var(--chart-1)' },
    { label: '2–3 dias', frac: 0.31, color: 'var(--chart-3)' },
    { label: '4–7 dias', frac: 0.19, color: 'var(--chart-5)' },
    { label: '8–15 dias', frac: 0.10, color: 'var(--chart-6)' },
    { label: '> 15 dias (INSS)', frac: 0.06, color: 'var(--chart-7)' },
  ];
  const durationBuckets = durationDist.map((d) => ({
    label: d.label,
    color: d.color,
    count: Math.round(total12 * d.frac),
    pct: d.frac * 100,
  }));
  const inss15 = durationBuckets[durationBuckets.length - 1].count;

  // CIDs específicos mais frequentes.
  const topCids = TOP_CID_CODES.map((c) => {
    const g = GROUP_BY_KEY[c.group];
    const count = Math.round(total12 * c.share * (0.9 + rng() * 0.2));
    return { code: c.code, label: c.label, group: g.label, groupKey: c.group, color: g.color, count, avgDays: g.avgDays };
  }).sort((a, b) => b.count - a.count);

  // Dias perdidos totais e KPIs.
  const diasPerdidos12 = groups.reduce((s, g) => s + g.days, 0);
  const lastMonth = monthlyByCid[monthlyByCid.length - 1];
  const prevMonth = monthlyByCid[monthlyByCid.length - 2] ?? lastMonth;
  const diasMes = Math.round(
    CID_GROUPS.reduce((s, g) => s + (lastMonth.values[g.key] ?? 0) * g.avgDays, 0),
  );
  const duracaoMedia = lastMonth.total ? diasMes / lastMonth.total : 0;
  const pctMental = total12 ? (totalsByGroup.F / total12) * 100 : 0;
  const taxaPor100 = (lastMonth.total / activeCount) * 100;
  const recorrencia = 8.4 + rng() * 2.5; // % de colaboradores com 3+ atestados em 12 meses

  return {
    activeCount,
    months12: last12.map((m) => MONTH_LABELS[m.getMonth()]),
    monthlyByCid,
    groups,
    heatmap: { rows: heatRows, cols: heatCols },
    mentalHealthTrend,
    durationBuckets,
    inss15,
    topCids,
    total12,
    diasPerdidos12,
    kpis: {
      atestadosMes: lastMonth.total,
      atestadosMesDelta: lastMonth.total - prevMonth.total,
      diasMes,
      duracaoMedia,
      pctMental,
      taxaPor100,
      recorrencia,
      inss15,
    },
  };
}
