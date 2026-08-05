import { createRng, gaussian, randInt } from './rng.js';
import { AREAS, ROLE_LEVELS } from './constants.js';

// Camada de dashboards específicos de RH, derivada de forma determinística do quadro ativo.
// Cada builder recebe `metrics` (usa activeNow, labels, headcountByArea) e devolve dados prontos
// para os componentes de gráfico/tabela. Tudo fictício e estável entre sessões.

const AREA_BASE = Object.fromEntries(AREAS.map((a) => [a.name, a.baseSalary]));
const ROLE_MULT = Object.fromEntries(ROLE_LEVELS.map((r) => [r.level, r.salaryMult]));
const CHART = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-6)', 'var(--chart-5)', 'var(--chart-4)', 'var(--chart-7)', 'var(--chart-2)', 'var(--chart-8)'];

function activeOf(metrics) {
  return metrics.activeNow;
}
function areaCounts(active) {
  const m = {};
  for (const e of active) m[e.area] = (m[e.area] ?? 0) + 1;
  return m;
}
function months12(metrics) {
  return metrics.labels.slice(-12);
}
function monthlySeries(rng, labels, base, drift = 0, noise = 0.18) {
  return labels.map((label, i) => ({ label, y: Math.max(0, Math.round(base * (1 + drift * (i / 11)) * (1 - noise / 2 + rng() * noise))) }));
}
function toRows(map) {
  return [...map.entries()];
}

// ---- Cota legal de PCD (Lei 8.213/91) ----
function pcdQuotaPct(headcount) {
  if (headcount <= 200) return 2;
  if (headcount <= 500) return 3;
  if (headcount <= 1000) return 4;
  return 5;
}

export function buildPositioning(metrics) {
  const active = activeOf(metrics);
  let below = 0, within = 0, above = 0, sum = 0;
  const byAreaSum = {}, byAreaN = {};
  const byRoleSum = {}, byRoleN = {};
  for (const e of active) {
    const mid = (AREA_BASE[e.area] ?? 6000) * (ROLE_MULT[e.roleLevel] ?? 1);
    const compa = e.salary / (mid || 1);
    sum += compa;
    if (compa < 0.9) below++; else if (compa > 1.1) above++; else within++;
    byAreaSum[e.area] = (byAreaSum[e.area] ?? 0) + compa; byAreaN[e.area] = (byAreaN[e.area] ?? 0) + 1;
    byRoleSum[e.roleLevel] = (byRoleSum[e.roleLevel] ?? 0) + compa; byRoleN[e.roleLevel] = (byRoleN[e.roleLevel] ?? 0) + 1;
  }
  const n = active.length || 1;
  const avg = sum / n;
  const dist = [
    { label: 'Abaixo do piso (<0,90)', count: below, pct: (below / n) * 100, color: 'var(--chart-5)' },
    { label: 'Dentro da faixa (0,90–1,10)', count: within, pct: (within / n) * 100, color: 'var(--chart-4)' },
    { label: 'Acima do teto (>1,10)', count: above, pct: (above / n) * 100, color: 'var(--chart-7)' },
  ];
  const byArea = Object.keys(byAreaSum).map((a) => ({ area: a, compa: byAreaSum[a] / byAreaN[a] })).sort((x, y) => y.compa - x.compa);
  const byRole = ROLE_LEVELS.map((r) => ({ role: r.level, compa: byRoleN[r.level] ? byRoleSum[r.level] / byRoleN[r.level] : 0 })).filter((r) => r.compa > 0);
  return {
    kpis: { compaMedio: avg, pctAbaixo: (below / n) * 100, pctAcima: (above / n) * 100, pctDentro: (within / n) * 100 },
    dist, byArea, byRole,
  };
}

export function buildPcd(metrics) {
  const active = activeOf(metrics);
  const total = active.length || 1;
  const pcd = active.filter((e) => e.pcd);
  const quotaPct = pcdQuotaPct(total);
  const required = Math.ceil((quotaPct / 100) * total);
  const current = pcd.length;
  const gap = Math.max(0, required - current);
  const byType = {};
  for (const e of pcd) byType[e.pcdType ?? 'Não informado'] = (byType[e.pcdType ?? 'Não informado'] ?? 0) + 1;
  const typeData = Object.keys(byType).map((t, i) => ({ label: t, count: byType[t], pct: (byType[t] / (current || 1)) * 100, color: CHART[i % CHART.length] }));
  const ac = areaCounts(active);
  const pcdByAreaMap = {};
  for (const e of pcd) pcdByAreaMap[e.area] = (pcdByAreaMap[e.area] ?? 0) + 1;
  const byArea = Object.keys(ac).map((a) => ({ area: a, count: pcdByAreaMap[a] ?? 0, pct: ((pcdByAreaMap[a] ?? 0) / ac[a]) * 100 })).sort((x, y) => y.count - x.count);
  return {
    kpis: { current, currentPct: (current / total) * 100, quotaPct, required, gap, cumprimento: (current / (required || 1)) * 100 },
    typeData, byArea,
  };
}

export function buildApprentices(metrics) {
  const rng = createRng(310755);
  const active = activeOf(metrics);
  const total = active.length || 1;
  // Cota de aprendizes: 5%–15% dos cargos que demandam formação (aprox. base operacional).
  const baseCargos = Math.round(total * 0.62);
  const required = Math.round(baseCargos * 0.05);
  const current = Math.round(required * (0.78 + rng() * 0.35));
  const gap = Math.max(0, required - current);
  const ac = areaCounts(active);
  const byArea = Object.keys(ac).sort((a, b) => ac[b] - ac[a]).slice(0, 6).map((a, i) => ({ area: a, count: Math.max(0, Math.round(current * (ac[a] / total) * (0.7 + rng() * 0.8))) }));
  const labels = months12(metrics);
  const expirations = labels.map((label) => ({ label, y: Math.max(0, Math.round(gaussian(rng, current / 16, 1.5))) }));
  const admissions = labels.map((label) => ({ label, y: Math.max(0, Math.round(gaussian(rng, current / 14, 1.6))) }));
  return {
    kpis: { current, required, gap, cumprimento: (current / (required || 1)) * 100, vencendo90d: Math.round(current * 0.14) },
    byArea, expirations, admissions,
  };
}

const DISCIPLINARY_TYPES = [
  { key: 'verbal', label: 'Advertência verbal', color: 'var(--chart-1)', weight: 42 },
  { key: 'escrita', label: 'Advertência escrita', color: 'var(--chart-5)', weight: 33 },
  { key: 'suspensao', label: 'Suspensão', color: 'var(--chart-7)', weight: 18 },
  { key: 'justa', label: 'Desligamento por justa causa', color: 'var(--color-danger)', weight: 7 },
];
const DISCIPLINARY_REASONS = ['Faltas/atrasos recorrentes', 'Conduta inadequada', 'Insubordinação', 'Descumprimento de norma', 'Uso indevido de recurso', 'Baixo desempenho reiterado'];

export function buildDisciplinary(metrics) {
  const rng = createRng(918273);
  const active = activeOf(metrics);
  const total = active.length || 1;
  const labels = months12(metrics);
  const monthly = labels.map((label) => ({ label, total: 0, values: {} }));
  const byType = Object.fromEntries(DISCIPLINARY_TYPES.map((t) => [t.key, 0]));
  const byReason = Object.fromEntries(DISCIPLINARY_REASONS.map((r) => [r, 0]));
  const baseMonthly = total * 0.012;
  monthly.forEach((m) => {
    const count = Math.max(0, Math.round(gaussian(rng, baseMonthly, baseMonthly * 0.3)));
    for (let i = 0; i < count; i++) {
      const t = DISCIPLINARY_TYPES[weightedIndex(rng, DISCIPLINARY_TYPES)];
      m.values[t.key] = (m.values[t.key] ?? 0) + 1;
      m.total++;
      byType[t.key]++;
      const r = DISCIPLINARY_REASONS[randInt(rng, 0, DISCIPLINARY_REASONS.length - 1)];
      byReason[r]++;
    }
  });
  const total12 = Object.values(byType).reduce((s, v) => s + v, 0);
  return {
    kpis: {
      total12,
      taxaPor100: (total12 / total) * 100,
      suspensoes: byType.suspensao,
      justaCausa: byType.justa,
      reincidencia: 12 + rng() * 6,
    },
    monthly,
    series: DISCIPLINARY_TYPES.map((t) => ({ key: t.key, label: t.label, color: t.color })),
    byType: DISCIPLINARY_TYPES.map((t) => ({ label: t.label, count: byType[t.key], pct: total12 ? (byType[t.key] / total12) * 100 : 0, color: t.color })),
    byReason: DISCIPLINARY_REASONS.map((r) => ({ reason: r, count: byReason[r] })).sort((a, b) => b.count - a.count),
  };
}

const TICKET_CATEGORIES = [
  { key: 'folha', label: 'Folha e pagamento', color: 'var(--chart-1)', weight: 26, sla: 92 },
  { key: 'beneficios', label: 'Benefícios', color: 'var(--chart-3)', weight: 21, sla: 88 },
  { key: 'ferias', label: 'Férias e afastamentos', color: 'var(--chart-6)', weight: 17, sla: 90 },
  { key: 'documentos', label: 'Documentos e declarações', color: 'var(--chart-5)', weight: 15, sla: 95 },
  { key: 'sistemas', label: 'Sistemas e acessos', color: 'var(--chart-4)', weight: 12, sla: 84 },
  { key: 'duvidas', label: 'Dúvidas trabalhistas', color: 'var(--chart-7)', weight: 9, sla: 80 },
];

export function buildTickets(metrics) {
  const rng = createRng(556677);
  const active = activeOf(metrics);
  const total = active.length || 1;
  const labels = months12(metrics);
  const openedBase = total * 0.08;
  const series = labels.map((label, i) => {
    const opened = Math.max(0, Math.round(gaussian(rng, openedBase, openedBase * 0.18)));
    const resolved = Math.max(0, Math.round(opened * (0.9 + rng() * 0.12)));
    return { label, total: opened, values: { resolved, pending: Math.max(0, opened - resolved) } };
  });
  const lastOpened = series[series.length - 1].total;
  const lastResolved = series[series.length - 1].values.resolved;
  const totalW = TICKET_CATEGORIES.reduce((s, c) => s + c.weight, 0);
  const byCategory = TICKET_CATEGORIES.map((c) => ({ label: c.label, value: Math.round(lastOpened * (c.weight / totalW)), color: c.color }));
  const slaByCategory = TICKET_CATEGORIES.map((c) => ({ label: c.label, value: Math.round(c.sla + gaussian(rng, 0, 2)) }));
  const slaGeral = slaByCategory.reduce((s, c) => s + c.value, 0) / slaByCategory.length;
  return {
    kpis: {
      abertosMes: lastOpened,
      resolvidosMes: lastResolved,
      backlog: Math.max(0, Math.round(lastOpened * 0.22)),
      sla: slaGeral,
      tempoMedio: 1.8 + rng() * 1.5,
    },
    series, byCategory, slaByCategory,
    seriesKeys: [{ key: 'resolved', label: 'Resolvidos', color: 'var(--chart-4)' }, { key: 'pending', label: 'Pendentes', color: 'var(--chart-5)' }],
  };
}

const LABOR_REASONS = ['Verbas rescisórias', 'Horas extras', 'Equiparação salarial', 'Adicional de insalubridade', 'Dano moral', 'Vínculo/terceirização'];
const LABOR_STATUS = [
  { key: 'andamento', label: 'Em andamento', color: 'var(--chart-1)', weight: 46 },
  { key: 'acordo', label: 'Acordo', color: 'var(--chart-4)', weight: 31 },
  { key: 'improcedente', label: 'Improcedente', color: 'var(--chart-3)', weight: 15 },
  { key: 'procedente', label: 'Procedente', color: 'var(--chart-7)', weight: 8 },
];

export function buildLabor(metrics) {
  const rng = createRng(667788);
  const active = activeOf(metrics);
  const total = active.length || 1;
  const labels = months12(metrics);
  const ativos = Math.round(total * 0.03 + randInt(rng, 4, 12));
  const ticket = 24000 + rng() * 16000;
  const provisao = Math.round(ativos * ticket);
  const totalW = LABOR_REASONS.length;
  const byReason = LABOR_REASONS.map((r, i) => ({ reason: r, count: Math.round(ativos * ((totalW - i) / (totalW * (totalW + 1) / 2)) * (0.8 + rng() * 0.5)) })).sort((a, b) => b.count - a.count);
  const stW = LABOR_STATUS.reduce((s, c) => s + c.weight, 0);
  const byStatus = LABOR_STATUS.map((s) => ({ label: s.label, count: Math.round(ativos * (s.weight / stW)), pct: (s.weight / stW) * 100, color: s.color }));
  const provisionSeries = labels.map((label, i) => ({ label, y: Math.round(provisao * (0.82 + (i / 11) * 0.3) * (0.96 + rng() * 0.08)) }));
  const flow = labels.map((label) => {
    const novas = Math.max(0, Math.round(gaussian(rng, ativos / 10, 1.2)));
    const encerradas = Math.max(0, Math.round(gaussian(rng, ativos / 11, 1.2)));
    return { label, total: novas + encerradas, values: { novas, encerradas } };
  });
  return {
    kpis: { ativos, provisao, ticket, novasMes: flow[flow.length - 1].values.novas, encerradasMes: flow[flow.length - 1].values.encerradas, indice: (ativos / total) * 1000 },
    byReason, byStatus, provisionSeries, flow,
    flowKeys: [{ key: 'novas', label: 'Novas', color: 'var(--chart-5)' }, { key: 'encerradas', label: 'Encerradas', color: 'var(--chart-4)' }],
  };
}

const EPI_TYPES = [
  { key: 'capacete', label: 'Capacete', unit: 24, color: 'var(--chart-1)', weight: 12 },
  { key: 'luva', label: 'Luvas', unit: 9, color: 'var(--chart-3)', weight: 28 },
  { key: 'botina', label: 'Botina de segurança', unit: 85, color: 'var(--chart-6)', weight: 16 },
  { key: 'oculos', label: 'Óculos de proteção', unit: 18, color: 'var(--chart-5)', weight: 15 },
  { key: 'auricular', label: 'Protetor auricular', unit: 6, color: 'var(--chart-4)', weight: 14 },
  { key: 'mascara', label: 'Máscara/respirador', unit: 22, color: 'var(--chart-7)', weight: 9 },
  { key: 'cinto', label: 'Cinto de segurança', unit: 190, color: 'var(--chart-2)', weight: 3 },
  { key: 'facial', label: 'Protetor facial', unit: 40, color: 'var(--chart-8)', weight: 3 },
];

export function buildEpi(metrics) {
  const rng = createRng(474839);
  const active = activeOf(metrics);
  const exposed = Math.round((active.length || 1) * 0.34); // expostos a risco
  const labels = months12(metrics);
  const totalW = EPI_TYPES.reduce((s, t) => s + t.weight, 0);
  const consumo = EPI_TYPES.map((t) => {
    const qtd = Math.round(exposed * (t.weight / totalW) * (0.9 + rng() * 0.4));
    return { key: t.key, label: t.label, value: qtd, cost: qtd * t.unit, color: t.color };
  }).sort((a, b) => b.value - a.value);
  const custoMes = consumo.reduce((s, c) => s + c.cost, 0);
  const custoSeries = monthlySeries(rng, labels, custoMes, 0.06, 0.16);
  const estoque = EPI_TYPES.map((t) => {
    const min = Math.round(exposed * (t.weight / totalW) * 0.5);
    const atual = Math.round(min * (0.6 + rng() * 1.1));
    return { label: t.label, atual, min, ruptura: atual < min };
  });
  const rupturas = estoque.filter((e) => e.ruptura).length;
  const caVencendo = labels.map((label) => ({ label, y: Math.max(0, Math.round(gaussian(rng, 3, 1.4))) }));
  return {
    kpis: {
      entregasMes: consumo.reduce((s, c) => s + c.value, 0),
      custoMes,
      conformidade: 88 + rng() * 8,
      rupturas,
      caVencendo90: Math.round(caVencendo.slice(-3).reduce((s, c) => s + c.y, 0)),
    },
    consumo, custoSeries, estoque, caVencendo,
  };
}

const NRS = [
  { key: 'nr05', label: 'NR-05 · CIPA', color: 'var(--chart-1)', cobertura: 96 },
  { key: 'nr06', label: 'NR-06 · EPI', color: 'var(--chart-3)', cobertura: 93 },
  { key: 'nr10', label: 'NR-10 · Elétrico', color: 'var(--chart-5)', cobertura: 74 },
  { key: 'nr11', label: 'NR-11 · Movimentação', color: 'var(--chart-4)', cobertura: 81 },
  { key: 'nr12', label: 'NR-12 · Máquinas', color: 'var(--chart-6)', cobertura: 69 },
  { key: 'nr33', label: 'NR-33 · Espaço confinado', color: 'var(--chart-7)', cobertura: 58 },
  { key: 'nr35', label: 'NR-35 · Trabalho em altura', color: 'var(--chart-2)', cobertura: 66 },
];

export function buildNrs(metrics) {
  const rng = createRng(102938);
  const active = activeOf(metrics);
  const exposed = Math.round((active.length || 1) * 0.34);
  const labels = months12(metrics);
  const cobertura = NRS.map((n) => ({ label: n.label, value: Math.round(n.cobertura + gaussian(rng, 0, 2)), color: n.color }));
  const treinadosMes = labels.map((label) => ({ label, y: Math.max(0, Math.round(gaussian(rng, exposed * 0.09, exposed * 0.02))) }));
  const vencimentos = labels.map((label) => ({ label, y: Math.max(0, Math.round(gaussian(rng, exposed * 0.05, exposed * 0.015))) }));
  const coberturaMedia = cobertura.reduce((s, c) => s + c.value, 0) / cobertura.length;
  return {
    kpis: {
      coberturaMedia,
      treinadosMes: treinadosMes[treinadosMes.length - 1].y,
      vencidos: Math.round(exposed * 0.08),
      vencendo60d: Math.round(exposed * 0.11),
    },
    cobertura, treinadosMes, vencimentos,
  };
}

const ASO_TYPES = [
  { key: 'admissional', label: 'Admissional', color: 'var(--chart-1)', weight: 22 },
  { key: 'periodico', label: 'Periódico', color: 'var(--chart-3)', weight: 46 },
  { key: 'demissional', label: 'Demissional', color: 'var(--chart-5)', weight: 16 },
  { key: 'retorno', label: 'Retorno ao trabalho', color: 'var(--chart-6)', weight: 9 },
  { key: 'mudanca', label: 'Mudança de função', color: 'var(--chart-4)', weight: 7 },
];

export function buildAso(metrics) {
  const rng = createRng(657483);
  const active = activeOf(metrics);
  const total = active.length || 1;
  const labels = months12(metrics);
  const asosMes = Math.round(total * 0.09);
  const totalW = ASO_TYPES.reduce((s, t) => s + t.weight, 0);
  const byType = ASO_TYPES.map((t) => ({ label: t.label, count: Math.round(asosMes * (t.weight / totalW)), pct: (t.weight / totalW) * 100, color: t.color }));
  const vencimentos = labels.map((label) => ({ label, y: Math.max(0, Math.round(gaussian(rng, total * 0.05, total * 0.012))) }));
  const emDia = 91 + rng() * 6;
  const aptidao = [
    { label: 'Apto', count: Math.round(asosMes * 0.9), pct: 90, color: 'var(--chart-4)' },
    { label: 'Apto com restrição', count: Math.round(asosMes * 0.08), pct: 8, color: 'var(--chart-5)' },
    { label: 'Inapto', count: Math.round(asosMes * 0.02), pct: 2, color: 'var(--color-danger)' },
  ];
  return {
    kpis: {
      asosMes,
      emDia,
      vencidos: Math.round(total * 0.04),
      vencendo30d: Math.round(total * 0.06),
      inaptos: aptidao[2].count,
    },
    byType, vencimentos, aptidao,
  };
}

function weightedIndex(rng, entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (let i = 0; i < entries.length; i++) { r -= entries[i].weight; if (r <= 0) return i; }
  return entries.length - 1;
}

export function buildHrExtras(metrics) {
  return {
    positioning: buildPositioning(metrics),
    pcd: buildPcd(metrics),
    apprentices: buildApprentices(metrics),
    disciplinary: buildDisciplinary(metrics),
    tickets: buildTickets(metrics),
    labor: buildLabor(metrics),
    epi: buildEpi(metrics),
    nrs: buildNrs(metrics),
    aso: buildAso(metrics),
  };
}
