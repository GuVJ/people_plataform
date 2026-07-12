import { AREAS, AREA_TO_VP, ROLE_LEVELS, LEADERSHIP_LEVELS, UNITS, GENDERS, RACES, BENEFITS } from './constants.js';
import { resolveGeneration } from './generateEmployees.js';
import { diffInYears } from '../utils/dates.js';

const AREA_NAMES = AREAS.map((a) => a.name);
const ROLE_NAMES = ROLE_LEVELS.map((r) => r.level);
const GENDER_NAMES = GENDERS.map((g) => g.value);
const RACE_NAMES = RACES.map((r) => r.value);

function normalize(text) {
  return String(text ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchEnum(value, options) {
  const target = normalize(value);
  if (!target) return null;
  return options.find((o) => normalize(o) === target) ?? null;
}

// Accepts JS Date, Excel serial numbers (SheetJS with cellDates:false), or 'YYYY-MM-DD' / 'DD/MM/YYYY' strings.
export function parseDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + value * 86400000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const str = String(value).trim();
  if (!str) return null;
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const d = new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function parseBoolean(value) {
  const v = normalize(value);
  return v === 'sim' || v === 'true' || v === '1' || v === 'x';
}

function parseBenefits(value) {
  if (Array.isArray(value)) return value;
  const raw = String(value ?? '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  const matched = raw.map((r) => matchEnum(r, BENEFITS)).filter(Boolean);
  return matched.length ? matched : ['Vale Refeição', 'Vale Transporte'];
}

function nextId(employees) {
  return employees.reduce((max, e) => Math.max(max, e.id), 0) + 1;
}

function resolveManager(gestorNome, employees) {
  const name = String(gestorNome ?? '').trim();
  if (!name) return { managerId: null, managerName: 'A definir' };
  const target = normalize(name);
  const found = employees.find((e) => e.status === 'Ativo' && normalize(e.name) === target);
  if (found) return { managerId: found.id, managerName: found.name };
  return { managerId: null, managerName: name };
}

// rawInput uses the same field names as the Excel template / cadastro form.
// { nome, genero, raca, dataNascimento, pcd, pcdTipo, area, cargo, unidade, gestorNome, salario, dataAdmissao, beneficios }
export function createEmployeeFromInput(rawInput, { employees, referenceDate }) {
  const errors = [];

  const nome = String(rawInput.nome ?? '').trim();
  if (!nome) errors.push('Nome é obrigatório.');

  const genero = matchEnum(rawInput.genero, GENDER_NAMES);
  if (!genero) errors.push(`Gênero inválido: "${rawInput.genero ?? ''}" (use ${GENDER_NAMES.join(', ')}).`);

  const raca = matchEnum(rawInput.raca, RACE_NAMES);
  if (!raca) errors.push(`Raça/etnia inválida: "${rawInput.raca ?? ''}" (use ${RACE_NAMES.join(', ')}).`);

  const birthDate = parseDate(rawInput.dataNascimento);
  if (!birthDate) errors.push('Data de nascimento inválida ou ausente.');

  const areaName = matchEnum(rawInput.area, AREA_NAMES);
  if (!areaName) errors.push(`Diretoria inválida: "${rawInput.area ?? ''}" (use ${AREA_NAMES.join(', ')}).`);

  const roleLevelName = matchEnum(rawInput.cargo, ROLE_NAMES);
  if (!roleLevelName) errors.push(`Cargo inválido: "${rawInput.cargo ?? ''}" (use ${ROLE_NAMES.join(', ')}).`);

  const unidade = matchEnum(rawInput.unidade, UNITS) ?? (String(rawInput.unidade ?? '').trim() || null);
  if (!unidade) errors.push('Unidade é obrigatória.');

  const salario = Number(rawInput.salario);
  if (!salario || salario <= 0) errors.push('Salário deve ser um número maior que zero.');

  const admissionDate = parseDate(rawInput.dataAdmissao);
  if (!admissionDate) errors.push('Data de admissão inválida ou ausente.');

  if (errors.length) return { employee: null, errors };

  const pcd = parseBoolean(rawInput.pcd);
  const { managerId, managerName } = resolveManager(rawInput.gestorNome, employees);
  const isLeadership = LEADERSHIP_LEVELS.has(roleLevelName);
  const age = diffInYears(birthDate, referenceDate);

  const employee = {
    id: nextId(employees),
    name: nome,
    gender: genero,
    race: raca,
    birthDate,
    age: Math.max(0, Math.floor(age)),
    generation: resolveGeneration(birthDate.getFullYear()),
    pcd,
    pcdType: pcd ? (String(rawInput.pcdTipo ?? '').trim() || 'Não especificado') : null,
    unit: unidade,
    area: areaName,
    vp: AREA_TO_VP[areaName] ?? null,
    roleLevel: roleLevelName,
    isLeadership,
    managerId,
    managerName,
    salary: salario,
    admissionDate,
    terminationDate: null,
    status: 'Ativo',
    terminationType: null,
    terminationReason: null,
    tenureYears: Math.max(0, diffInYears(admissionDate, referenceDate)),
    performanceScore: null,
    performanceBucket: 'Não avaliado',
    potential: 'Não avaliado',
    nineBox: 'Não avaliado',
    engagementScore: 70,
    climateScore: 3.5,
    trainingHoursYear: 0,
    trainingsCompleted: [],
    vacationBalance: 30,
    promotions: 0,
    benefits: parseBenefits(rawInput.beneficios),
    monthlyAbsence: new Map(),
    monthlyOvertime: new Map(),
  };

  return { employee, errors: [] };
}
