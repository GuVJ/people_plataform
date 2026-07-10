import { createRng, pickWeighted, randFloat } from './rng.js';
import { AREAS, RECRUITMENT_SOURCES, FUNNEL_STAGES, MARKET_BENCHMARK } from './constants.js';
import { endOfMonth, monthLabel, diffInYears } from '../utils/dates.js';
import { sum, average, groupBy, pctChange, clamp } from '../utils/stats.js';

const WORKING_DAYS_MONTH = 21;
const REPLACEMENT_COST_FACTOR = 0.6; // % of annual salary lost per termination (recruiting + ramp-up + productivity)
const HOURLY_DIVISOR = 220;

function isActiveAt(emp, date) {
  return emp.admissionDate <= date && (!emp.terminationDate || emp.terminationDate > date);
}

function snapshotAt(employees, date) {
  const active = employees.filter((e) => isActiveAt(e, date));
  const women = active.filter((e) => e.gender === 'Feminino').length;
  const avgTenure = average(active, (e) => diffInYears(e.admissionDate, date));
  const payroll = sum(active, (e) => e.salary);
  return {
    date,
    count: active.length,
    active,
    womenPct: active.length ? (women / active.length) * 100 : 0,
    avgTenureYears: avgTenure,
    payroll,
  };
}

export function deriveMetrics(employees, months, referenceDate) {
  const monthEnds = months.map(endOfMonth);
  const labels = months.map((m) => monthLabel(m));

  const headcountSeries = monthEnds.map((end, i) => ({
    month: months[i], label: labels[i], total: employees.filter((e) => isActiveAt(e, end)).length,
  }));

  const admissionsSeries = months.map((m, i) => ({
    month: m, label: labels[i],
    total: employees.filter((e) => e.admissionDate >= m && e.admissionDate <= monthEnds[i]).length,
  }));

  const terminationsSeries = months.map((m, i) => {
    const terms = employees.filter((e) => e.terminationDate && e.terminationDate >= m && e.terminationDate <= monthEnds[i]);
    const voluntary = terms.filter((e) => e.terminationType === 'Voluntário').length;
    const involuntary = terms.filter((e) => e.terminationType === 'Involuntário').length;
    return { month: m, label: labels[i], voluntary, involuntary, total: terms.length, cost: sum(terms, (e) => e.salary * 12 * REPLACEMENT_COST_FACTOR) };
  });

  const turnoverSeries = terminationsSeries.map((t, i) => {
    const prevHc = i > 0 ? headcountSeries[i - 1].total : headcountSeries[i].total;
    const avgHc = (prevHc + headcountSeries[i].total) / 2 || 1;
    return {
      month: t.month, label: t.label,
      voluntaryRate: (t.voluntary / avgHc) * 100,
      involuntaryRate: (t.involuntary / avgHc) * 100,
      totalRate: (t.total / avgHc) * 100,
    };
  });

  const payrollSeries = monthEnds.map((end, i) => ({
    month: months[i], label: labels[i],
    total: sum(employees.filter((e) => isActiveAt(e, end)), (e) => e.salary),
  }));

  const tenureSeries = monthEnds.map((end, i) => {
    const active = employees.filter((e) => isActiveAt(e, end));
    return { month: months[i], label: labels[i], years: average(active, (e) => diffInYears(e.admissionDate, end)) };
  });

  const diversityWomenSeries = monthEnds.map((end, i) => {
    const active = employees.filter((e) => isActiveAt(e, end));
    const women = active.filter((e) => e.gender === 'Feminino').length;
    return { month: months[i], label: labels[i], pct: active.length ? (women / active.length) * 100 : 0 };
  });

  const absenteeismSeries = months.map((m, i) => {
    const activeThisMonth = employees.filter((e) => isActiveAt(e, monthEnds[i]) || (e.terminationDate && e.terminationDate >= m && e.terminationDate <= monthEnds[i]));
    const key = monthKeyOf(m);
    let totalDays = 0;
    for (const e of activeThisMonth) {
      const rec = e.monthlyAbsence.get(key);
      if (rec) totalDays += rec.days;
    }
    const denom = activeThisMonth.length * WORKING_DAYS_MONTH || 1;
    return { month: m, label: labels[i], rate: (totalDays / denom) * 100, totalDays, headcount: activeThisMonth.length };
  });

  const overtimeSeries = months.map((m, i) => {
    const activeThisMonth = employees.filter((e) => isActiveAt(e, monthEnds[i]) || (e.terminationDate && e.terminationDate >= m && e.terminationDate <= monthEnds[i]));
    const key = monthKeyOf(m);
    let totalHours = 0;
    let cost = 0;
    for (const e of activeThisMonth) {
      const h = e.monthlyOvertime.get(key);
      if (h) {
        totalHours += h;
        cost += h * (e.salary / HOURLY_DIVISOR) * 1.5;
      }
    }
    return { month: m, label: labels[i], hours: totalHours, cost };
  });

  const snapNow = snapshotAt(employees, referenceDate);
  const snapPrevMonth = snapshotAt(employees, monthEnds[monthEnds.length - 2]);
  const activeNow = snapNow.active;

  // ---- Workforce ----
  const byArea = groupBy(activeNow, (e) => e.area);
  const headcountByArea = AREAS.map((a) => ({ area: a.name, count: byArea.get(a.name)?.length ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const byRole = groupBy(activeNow, (e) => e.roleLevel);
  const headcountByRole = [...byRole.entries()].map(([role, list]) => ({ role, count: list.length })).sort((a, b) => b.count - a.count);

  const salaryBands = buildSalaryBands(activeNow);

  // ---- Turnover breakdowns ----
  const last12Terminated = employees.filter((e) => e.terminationDate && e.terminationDate >= months[months.length - 12] && e.terminationDate <= monthEnds[monthEnds.length - 1]);
  const reasonCounts = new Map();
  for (const e of last12Terminated) {
    reasonCounts.set(e.terminationReason, (reasonCounts.get(e.terminationReason) ?? 0) + 1);
  }
  const terminationReasons = [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);

  const turnoverByAreaMap = groupBy(last12Terminated, (e) => e.area);
  const turnoverByArea = AREAS.map((a) => {
    const terms = turnoverByAreaMap.get(a.name) ?? [];
    const hc = byArea.get(a.name)?.length || 1;
    return { area: a.name, count: terms.length, rate: (terms.length / hc) * 100, cost: sum(terms, (e) => e.salary * 12 * REPLACEMENT_COST_FACTOR) };
  }).sort((a, b) => b.rate - a.rate);

  const turnoverHistoryYoY = [
    { period: 'Ano anterior', rate: average(turnoverSeries.slice(0, 12), (t) => t.totalRate) },
    { period: 'Últimos 12 meses', rate: average(turnoverSeries.slice(-12), (t) => t.totalRate) },
  ];

  // ---- Diversity ----
  const diversity = {
    gender: distribution(activeNow, (e) => e.gender),
    race: distribution(activeNow, (e) => e.race),
    generation: distribution(activeNow, (e) => e.generation),
    pcdPct: (activeNow.filter((e) => e.pcd).length / (activeNow.length || 1)) * 100,
    leadershipGender: distribution(activeNow.filter((e) => e.isLeadership), (e) => e.gender),
    leadershipRace: distribution(activeNow.filter((e) => e.isLeadership), (e) => e.race),
  };

  // ---- Absenteeism breakdowns ----
  const reasonTotals = new Map();
  const managerAbsence = new Map();
  const unitAbsence = new Map();
  for (const e of activeNow) {
    for (const [, rec] of e.monthlyAbsence) {
      reasonTotals.set(rec.reason, (reasonTotals.get(rec.reason) ?? 0) + rec.days);
      managerAbsence.set(e.managerName, (managerAbsence.get(e.managerName) ?? 0) + rec.days);
      unitAbsence.set(e.unit, (unitAbsence.get(e.unit) ?? 0) + rec.days);
    }
  }
  const absenteeismByReason = [...reasonTotals.entries()].map(([reason, days]) => ({ reason, days })).sort((a, b) => b.days - a.days);
  const absenteeismByManager = [...managerAbsence.entries()].map(([manager, days]) => ({ manager, days })).sort((a, b) => b.days - a.days).slice(0, 8);
  const absenteeismByUnit = [...unitAbsence.entries()].map(([unit, days]) => ({ unit, days })).sort((a, b) => b.days - a.days);

  // ---- Overtime breakdowns ----
  const overtimeByAreaMap = new Map();
  const overtimeByManagerMap = new Map();
  for (const e of activeNow) {
    for (const [, hours] of e.monthlyOvertime) {
      overtimeByAreaMap.set(e.area, (overtimeByAreaMap.get(e.area) ?? 0) + hours * (e.salary / HOURLY_DIVISOR) * 1.5);
      overtimeByManagerMap.set(e.managerName, (overtimeByManagerMap.get(e.managerName) ?? 0) + hours);
    }
  }
  const overtimeByArea = [...overtimeByAreaMap.entries()].map(([area, cost]) => ({ area, cost })).sort((a, b) => b.cost - a.cost);
  const overtimeByManager = [...overtimeByManagerMap.entries()].map(([manager, hours]) => ({ manager, hours })).sort((a, b) => b.hours - a.hours).slice(0, 8);

  // ---- Training ----
  const hoursTotal = sum(activeNow, (e) => e.trainingHoursYear);
  const hoursPerEmployee = hoursTotal / (activeNow.length || 1);
  const participationPct = (activeNow.filter((e) => e.trainingHoursYear > 0).length / (activeNow.length || 1)) * 100;
  const completionPct = clamp(58 + hoursPerEmployee * 1.4, 40, 97);
  const trainingInvestment = hoursTotal * 95;
  const trainingReturn = trainingInvestment * 2.4;
  const training = {
    hoursTotal, hoursPerEmployee, participationPct, completionPct,
    trainingInvestment, trainingReturn, roiRatio: trainingReturn / (trainingInvestment || 1),
    topTrainings: topTrainingsList(activeNow),
  };

  // ---- Performance / Nine Box ----
  const performanceDistribution = distribution(activeNow, (e) => e.performanceBucket);
  const nineBoxGrid = buildNineBox(activeNow);
  const criticalTalents = activeNow
    .filter((e) => e.performanceBucket === 'Alto' && e.potential === 'Alto')
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 12);
  const promotionsCount = sum(activeNow, (e) => e.promotions);

  // ---- Recruitment (fabricated funnel anchored to real admissions) ----
  const rng = createRng(777001);
  const recentAdmissions = sum(admissionsSeries.slice(-6), (a) => a.total);
  const recruitment = buildRecruitmentFunnel(rng, recentAdmissions, headcountByArea, labels);

  const kpis = buildKpis({
    snapNow, snapPrevMonth, headcountSeries, admissionsSeries, terminationsSeries,
    turnoverSeries, absenteeismSeries, overtimeSeries, payrollSeries, diversity, recruitment,
  });

  return {
    months, monthEnds, labels, referenceDate,
    headcountSeries, admissionsSeries, terminationsSeries, turnoverSeries, payrollSeries,
    absenteeismSeries, overtimeSeries, tenureSeries, diversityWomenSeries,
    headcountByArea, headcountByRole, salaryBands,
    terminationReasons, turnoverByArea, turnoverHistoryYoY,
    diversity,
    absenteeismByReason, absenteeismByManager, absenteeismByUnit,
    overtimeByArea, overtimeByManager,
    training, performanceDistribution, nineBoxGrid, criticalTalents, promotionsCount,
    recruitment,
    kpis,
    activeNow,
    benchmark: MARKET_BENCHMARK,
  };
}

function monthKeyOf(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function distribution(list, keyFn) {
  const total = list.length || 1;
  const map = new Map();
  for (const item of list) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, count]) => ({ label, count, pct: (count / total) * 100 })).sort((a, b) => b.count - a.count);
}

function buildSalaryBands(activeNow) {
  const bands = [
    { label: 'Até R$ 3k', min: 0, max: 3000 },
    { label: 'R$ 3k–6k', min: 3000, max: 6000 },
    { label: 'R$ 6k–10k', min: 6000, max: 10000 },
    { label: 'R$ 10k–18k', min: 10000, max: 18000 },
    { label: 'Acima de R$ 18k', min: 18000, max: Infinity },
  ];
  return bands.map((b) => ({
    label: b.label,
    count: activeNow.filter((e) => e.salary >= b.min && e.salary < b.max).length,
  }));
}

function topTrainingsList(activeNow) {
  const map = new Map();
  for (const e of activeNow) {
    for (const t of e.trainingsCompleted) {
      map.set(t, (map.get(t) ?? 0) + 1);
    }
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
}

function buildNineBox(activeNow) {
  const perfOrder = ['Baixo', 'Médio', 'Alto'];
  const potOrder = ['Baixo', 'Médio', 'Alto'];
  const grid = [];
  for (const potential of [...potOrder].reverse()) {
    for (const perf of perfOrder) {
      const count = activeNow.filter((e) => e.potential === potential && e.performanceBucket === perf).length;
      grid.push({ potential, performance: perf, count });
    }
  }
  return grid;
}

function buildRecruitmentFunnel(rng, hiredCount, headcountByArea, labels) {
  const conversions = [0.44, 0.55, 0.64, 0.7, 0.6, 0.82];
  const hired = Math.max(hiredCount, 12);
  const stageCounts = [hired];
  let current = hired;
  for (let i = conversions.length - 1; i >= 0; i--) {
    current = Math.round(current / conversions[i]);
    stageCounts.unshift(current);
  }
  const funnel = FUNNEL_STAGES.map((stage, i) => ({ stage, count: stageCounts[i] }));

  const bySource = RECRUITMENT_SOURCES.map((s) => ({
    source: s.value,
    count: Math.round((s.weight / 100) * stageCounts[0]),
  }));

  const avgTimeToHireDaysCurrent = 31 + randFloat(rng, -3, 6, 1);
  const avgTimeToHireDaysPrevious = avgTimeToHireDaysCurrent * randFloat(rng, 1.04, 1.14, 2);
  const slaTargetDays = 30;
  const slaPct = clamp(78 - (avgTimeToHireDaysCurrent - slaTargetDays) * 2.4, 25, 96);

  const byAreaTimeToHire = headcountByArea.map((a) => {
    const bias = AREAS.find((ar) => ar.name === a.area)?.turnoverBias ?? 1;
    return { area: a.area, days: Math.round(24 + bias * 8 + randFloat(rng, -3, 5, 1)) };
  }).sort((a, b) => b.days - a.days);

  const recentLabels = labels.slice(-12);
  const timeToHireSeries = recentLabels.map((label, i) => {
    const progress = i / (recentLabels.length - 1);
    const value = avgTimeToHireDaysPrevious - (avgTimeToHireDaysPrevious - avgTimeToHireDaysCurrent) * progress + randFloat(rng, -1.5, 1.5, 1);
    return { label, days: Math.max(14, Math.round(value * 10) / 10) };
  });

  return {
    funnel, bySource, hired,
    avgTimeToHireDaysCurrent, avgTimeToHireDaysPrevious, slaPct, slaTargetDays,
    byAreaTimeToHire, timeToHireSeries,
  };
}

function buildKpis({ snapNow, snapPrevMonth, headcountSeries, admissionsSeries, terminationsSeries, turnoverSeries, absenteeismSeries, overtimeSeries, payrollSeries, diversity, recruitment }) {
  const last = (arr) => arr[arr.length - 1];
  const prev = (arr) => arr[arr.length - 2];

  const hc = last(headcountSeries).total;
  const hcPrev = prev(headcountSeries).total;
  const adm = last(admissionsSeries).total;
  const admPrev = prev(admissionsSeries).total;
  const term = last(terminationsSeries).total;
  const termPrev = prev(terminationsSeries).total;
  const turn = last(turnoverSeries).totalRate;
  const turnPrev = prev(turnoverSeries).totalRate;
  const abs = last(absenteeismSeries).rate;
  const absPrev = prev(absenteeismSeries).rate;
  const ot = last(overtimeSeries).cost;
  const otPrev = prev(overtimeSeries).cost;
  const payroll = last(payrollSeries).total;
  const payrollPrev = prev(payrollSeries).total;

  return [
    { key: 'headcount', label: 'Headcount ativo', value: hc, delta: pctChange(hc, hcPrev), format: 'number' },
    { key: 'admissoes', label: 'Admissões no mês', value: adm, delta: pctChange(adm, admPrev), format: 'number' },
    { key: 'desligamentos', label: 'Desligamentos no mês', value: term, delta: pctChange(term, termPrev), format: 'number', invertGood: true },
    { key: 'turnover', label: 'Turnover mensal', value: turn, delta: turn - turnPrev, format: 'percent', invertGood: true },
    { key: 'absenteismo', label: 'Absenteísmo', value: abs, delta: abs - absPrev, format: 'percent', invertGood: true },
    { key: 'horasExtras', label: 'Custo de horas extras', value: ot, delta: pctChange(ot, otPrev), format: 'currency', invertGood: true },
    { key: 'custoPessoal', label: 'Custo de pessoal (folha)', value: payroll, delta: pctChange(payroll, payrollPrev), format: 'currency' },
    { key: 'diversidade', label: 'Mulheres no quadro', value: snapNow.womenPct, delta: snapNow.womenPct - snapPrevMonth.womenPct, format: 'percent' },
    { key: 'tempoContratacao', label: 'Tempo médio de contratação', value: recruitment.avgTimeToHireDaysCurrent, delta: recruitment.avgTimeToHireDaysCurrent - recruitment.avgTimeToHireDaysPrevious, format: 'days', invertGood: true },
    { key: 'tempoEmpresa', label: 'Tempo médio na empresa', value: snapNow.avgTenureYears, delta: snapNow.avgTenureYears - snapPrevMonth.avgTenureYears, format: 'years' },
  ];
}
