import { createRng, pick, pickWeighted, randInt, randFloat, gaussian } from './rng.js';
import {
  AREAS, ROLE_LEVELS, LEADERSHIP_LEVELS, UNITS, GENDERS, RACES,
  FIRST_NAMES_F, FIRST_NAMES_M, FIRST_NAMES_NB, LAST_NAMES,
  TERMINATION_REASONS_VOLUNTARY, TERMINATION_REASONS_INVOLUNTARY,
  ABSENCE_REASONS, TRAININGS, BENEFITS,
} from './constants.js';
import { addMonths, addDays, lastNMonths, monthKey, endOfMonth, diffInYears } from '../utils/dates.js';

export const HISTORY_MONTHS = 24;
const AREA_SCALE = 1.8;

const IC_LEVELS = ROLE_LEVELS.filter((r) => !LEADERSHIP_LEVELS.has(r.level));
const MANAGER_LEVELS = ROLE_LEVELS.filter((r) => LEADERSHIP_LEVELS.has(r.level));

function weightedLevel(rng, pool) {
  return pickWeighted(rng, pool.map((r) => ({ value: r, weight: r.weight })));
}

function sampleTenureYears(rng, kind) {
  const buckets = kind === 'termHistorical'
    ? [{ r: [0.1, 1], w: 30 }, { r: [1, 2], w: 25 }, { r: [2, 4], w: 25 }, { r: [4, 7], w: 15 }, { r: [7, 11], w: 5 }]
    : kind === 'manager'
      ? [{ r: [1, 3], w: 15 }, { r: [3, 6], w: 30 }, { r: [6, 10], w: 30 }, { r: [10, 16], w: 25 }]
      : [{ r: [0, 1], w: 20 }, { r: [1, 3], w: 35 }, { r: [3, 6], w: 30 }, { r: [6, 10], w: 15 }];
  const [min, max] = pickWeighted(rng, buckets.map((b) => ({ value: b.r, weight: b.w })));
  return randFloat(rng, min, max, 2);
}

function pickName(rng, gender) {
  const pool = gender === 'Feminino' ? FIRST_NAMES_F : gender === 'Masculino' ? FIRST_NAMES_M : FIRST_NAMES_NB;
  return `${pick(rng, pool)} ${pick(rng, LAST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

export function resolveGeneration(birthYear) {
  if (birthYear >= 1997) return 'Geração Z';
  if (birthYear >= 1981) return 'Millennial';
  if (birthYear >= 1965) return 'Geração X';
  return 'Baby Boomer';
}

function turnoverTrendMultiplier(monthIndex, area) {
  const progress = monthIndex / (HISTORY_MONTHS - 1);
  let multiplier = 0.82 + progress * 0.38;
  if (area.name === 'Comercial' || area.name === 'Atendimento ao Cliente') {
    multiplier *= 1 + Math.max(0, progress - 0.55) * 1.6;
  }
  return multiplier;
}

function buildPersonBase(rng, referenceDate, roleLevel) {
  const genderInfo = pickWeighted(rng, GENDERS.map((g) => ({ value: g.value, weight: g.weight })));
  const raceInfo = pickWeighted(rng, RACES.map((r) => ({ value: r.value, weight: r.weight })));
  const [ageMin, ageMax] = roleLevel.ageRange;
  const age = randInt(rng, ageMin, ageMax);
  const birthDate = addDays(addMonths(referenceDate, -age * 12), -randInt(rng, 0, 364));
  const isPcd = rng() < 0.045;
  return {
    name: pickName(rng, genderInfo),
    gender: genderInfo,
    race: raceInfo,
    birthDate,
    age,
    generation: resolveGeneration(birthDate.getFullYear()),
    pcd: isPcd,
    pcdType: isPcd ? pick(rng, ['Física', 'Visual', 'Auditiva', 'Intelectual', 'Múltipla']) : null,
    unit: pick(rng, UNITS),
  };
}

function buildMonthlySeries(rng, employee, months, area) {
  const absence = new Map();
  const overtime = new Map();
  const isLeadership = LEADERSHIP_LEVELS.has(employee.roleLevel);
  const absenceMeanBase = { 'Operações': 1.3, 'Atendimento ao Cliente': 1.5 }[area.name] ?? 0.7;
  const overtimeMeanBase = 6 * area.overtimeBias * (isLeadership ? 0.4 : 1);

  for (const m of months) {
    const mEnd = endOfMonth(m);
    const admitted = employee.admissionDate <= mEnd;
    const stillActive = !employee.terminationDate || employee.terminationDate > mEnd;
    if (!admitted || !stillActive) continue;
    const key = monthKey(m);

    let absDays = Math.max(0, Math.round(gaussian(rng, absenceMeanBase, 1.1)));
    if (rng() < 0.04) absDays += randInt(rng, 3, 7);
    if (absDays > 0) {
      const reason = pickWeighted(rng, ABSENCE_REASONS.map((r) => ({ value: r.value, weight: r.weight })));
      absence.set(key, { days: absDays, reason });
    }

    const otHours = Math.max(0, Math.round(gaussian(rng, overtimeMeanBase, 4)));
    if (otHours > 0) overtime.set(key, otHours);
  }
  return { absence, overtime };
}

function buildPerformanceProfile(rng, isLeadership) {
  const performanceScore = Math.min(5, Math.max(1, Math.round(gaussian(rng, isLeadership ? 3.7 : 3.4, 0.65) * 10) / 10));
  const performanceBucket = performanceScore < 2.6 ? 'Baixo' : performanceScore < 3.9 ? 'Médio' : 'Alto';
  const potentialWeights = performanceBucket === 'Alto'
    ? [{ value: 'Baixo', weight: 10 }, { value: 'Médio', weight: 35 }, { value: 'Alto', weight: 55 }]
    : performanceBucket === 'Médio'
      ? [{ value: 'Baixo', weight: 20 }, { value: 'Médio', weight: 55 }, { value: 'Alto', weight: 25 }]
      : [{ value: 'Baixo', weight: 45 }, { value: 'Médio', weight: 40 }, { value: 'Alto', weight: 15 }];
  const potential = pickWeighted(rng, potentialWeights);
  return { performanceScore, performanceBucket, potential, nineBox: `${performanceBucket} desempenho / ${potential} potencial` };
}

function finalizeEmployee(rng, referenceDate, months, area, roleLevel, kind, managerPool, terminationMonthIndex) {
  const isLeadership = LEADERSHIP_LEVELS.has(roleLevel.level);
  const base = buildPersonBase(rng, referenceDate, roleLevel);
  const isHistorical = kind === 'termHistorical';
  const tenureYears = sampleTenureYears(rng, isLeadership ? 'manager' : isHistorical ? 'termHistorical' : 'active');

  let terminationDate = null;
  let admissionDate;
  if (isHistorical) {
    terminationDate = addDays(months[terminationMonthIndex], randInt(rng, 0, 26));
    admissionDate = addDays(terminationDate, -Math.round(tenureYears * 365));
  } else {
    admissionDate = addDays(referenceDate, -Math.round(tenureYears * 365));
  }

  const salaryVariance = randFloat(rng, 0.85, 1.2, 2);
  const salary = Math.round(area.baseSalary * roleLevel.salaryMult * salaryVariance / 10) * 10;

  let terminationType = null;
  let terminationReason = null;
  if (isHistorical) {
    const involuntaryProb = 0.22 + (area.turnoverBias - 1) * 0.12;
    const isInvoluntary = rng() < involuntaryProb;
    terminationType = isInvoluntary ? 'Involuntário' : 'Voluntário';
    terminationReason = isInvoluntary ? pick(rng, TERMINATION_REASONS_INVOLUNTARY) : pick(rng, TERMINATION_REASONS_VOLUNTARY);
  }

  const perf = buildPerformanceProfile(rng, isLeadership);
  const engagementScore = Math.round(Math.min(100, Math.max(5, gaussian(rng, 68 + (isLeadership ? 6 : 0) - (area.turnoverBias - 1) * 10, 12))));
  const climateScore = Math.min(5, Math.max(1, Math.round(gaussian(rng, engagementScore / 20, 0.5) * 10) / 10));
  const trainingHoursYear = Math.round(Math.max(0, gaussian(rng, 16, 8)));
  const trainingCount = Math.min(TRAININGS.length, Math.round(trainingHoursYear / 6));
  const trainingsCompleted = [...TRAININGS].sort(() => rng() - 0.5).slice(0, trainingCount);
  const vacationBalance = randInt(rng, 0, 30);
  const promotions = Math.min(3, Math.floor(tenureYears / 2.6) > 0 ? randInt(rng, 0, Math.min(3, Math.floor(tenureYears / 2.6))) : 0);
  const benefits = [...BENEFITS].sort(() => rng() - 0.5).slice(0, randInt(rng, 4, 7));

  const manager = !isLeadership && managerPool.length ? pick(rng, managerPool) : null;

  const employee = {
    ...base,
    area: area.name,
    vp: area.vp,
    roleLevel: roleLevel.level,
    isLeadership,
    managerId: manager?.id ?? null,
    managerName: manager?.name ?? (isLeadership ? 'Diretoria' : '—'),
    salary,
    admissionDate,
    terminationDate,
    status: terminationDate ? 'Desligado' : 'Ativo',
    terminationType,
    terminationReason,
    tenureYears,
    ...perf,
    engagementScore,
    climateScore,
    trainingHoursYear,
    trainingsCompleted,
    vacationBalance,
    promotions,
    benefits,
  };

  const { absence, overtime } = buildMonthlySeries(rng, employee, months, area);
  employee.monthlyAbsence = absence;
  employee.monthlyOvertime = overtime;
  return employee;
}

export function generateEmployees(seed = 20260710, referenceDate = new Date()) {
  const rng = createRng(seed);
  const months = lastNMonths(HISTORY_MONTHS, referenceDate);
  const employees = [];
  let idCounter = 1;

  for (const area of AREAS) {
    const activeTarget = Math.round(area.baseHeadcount * AREA_SCALE);
    const managerCount = Math.max(2, Math.round(activeTarget / 38));
    const managerPool = [];

    for (let i = 0; i < managerCount; i++) {
      const roleLevel = weightedLevel(rng, MANAGER_LEVELS);
      const emp = finalizeEmployee(rng, referenceDate, months, area, roleLevel, 'active', []);
      emp.id = idCounter++;
      employees.push(emp);
      managerPool.push({ id: emp.id, name: emp.name });
    }

    const icCount = activeTarget - managerCount;
    for (let i = 0; i < icCount; i++) {
      const roleLevel = weightedLevel(rng, IC_LEVELS);
      const emp = finalizeEmployee(rng, referenceDate, months, area, roleLevel, 'active', managerPool);
      emp.id = idCounter++;
      employees.push(emp);
    }

    for (let m = 0; m < HISTORY_MONTHS; m++) {
      const expected = activeTarget * 0.026 * area.turnoverBias * turnoverTrendMultiplier(m, area);
      const seasonal = (months[m].getMonth() === 0 || months[m].getMonth() === 11) ? 1.15 : 1;
      const count = Math.max(0, Math.round(expected * seasonal + gaussian(rng, 0, expected * 0.25)));
      for (let i = 0; i < count; i++) {
        const roleLevel = rng() < 0.08 ? weightedLevel(rng, MANAGER_LEVELS) : weightedLevel(rng, IC_LEVELS);
        const emp = finalizeEmployee(rng, referenceDate, months, area, roleLevel, 'termHistorical', managerPool, m);
        emp.id = idCounter++;
        employees.push(emp);
      }
    }
  }

  return { employees, months, referenceDate };
}
