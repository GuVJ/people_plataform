import { diffInMonths, diffInYears } from '../utils/dates.js';

export const SEVERANCE_SCENARIOS = [
  { key: 'sem_justa_causa', label: 'Sem justa causa', description: 'Desligamento por iniciativa da empresa — direitos integrais.' },
  { key: 'acordo', label: 'Acordo mútuo', description: 'Distrato (Lei 13.467/2017) — aviso e multa FGTS pela metade.' },
  { key: 'pedido_demissao', label: 'Pedido de demissão', description: 'Iniciativa do colaborador — sem aviso indenizado nem multa FGTS.' },
];

function monthsWorkedInCurrentYear(admissionDate, simDate) {
  const yearStart = new Date(simDate.getFullYear(), 0, 1);
  const start = admissionDate > yearStart ? admissionDate : yearStart;
  let months = (simDate.getFullYear() - start.getFullYear()) * 12 + (simDate.getMonth() - start.getMonth());
  if (simDate.getDate() >= 15) months += 1;
  return Math.max(0, Math.min(12, months));
}

function monthsSinceLastAdmissionAnniversary(admissionDate, simDate) {
  let anniversary = new Date(simDate.getFullYear(), admissionDate.getMonth(), admissionDate.getDate());
  if (anniversary > simDate) anniversary = new Date(simDate.getFullYear() - 1, admissionDate.getMonth(), admissionDate.getDate());
  if (anniversary < admissionDate) anniversary = admissionDate;
  let months = (simDate.getFullYear() - anniversary.getFullYear()) * 12 + (simDate.getMonth() - anniversary.getMonth());
  if (simDate.getDate() >= 15) months += 1;
  return Math.max(0, Math.min(12, months));
}

// Estimativa de rescisão CLT — para planejamento de RH/Financeiro, não substitui o cálculo
// oficial da folha (que considera saldo real de FGTS com juros, férias vencidas, adicionais
// etc.). Aviso prévio segue a Lei 12.506/2011: 30 dias + 3 dias por ano completo, até 90 dias.
export function simulateSeverance({ employee, scenario, referenceDate }) {
  const salary = employee.salary;
  const dailyRate = salary / 30;
  const admissionDate = employee.admissionDate;
  const simDate = referenceDate;

  const tenureMonths = Math.max(0, diffInMonths(admissionDate, simDate));
  const tenureYears = diffInYears(admissionDate, simDate);

  const saldoSalarioDias = simDate.getDate();
  const saldoSalario = dailyRate * saldoSalarioDias;

  const mesesAno = monthsWorkedInCurrentYear(admissionDate, simDate);
  const decimoTerceiro = (salary / 12) * mesesAno;

  const mesesAquisitivo = monthsSinceLastAdmissionAnniversary(admissionDate, simDate);
  const feriasProporcionais = (salary / 12) * mesesAquisitivo;
  const tercoConstitucional = feriasProporcionais / 3;

  const fgtsAcumulado = salary * 0.08 * tenureMonths;

  const avisoPrevioDias = Math.min(30 + Math.floor(tenureYears) * 3, 90);

  let avisoPrevio = 0;
  let multaFgts = 0;
  let saqueFgts = 0;

  if (scenario === 'sem_justa_causa') {
    avisoPrevio = dailyRate * avisoPrevioDias;
    multaFgts = fgtsAcumulado * 0.4;
    saqueFgts = fgtsAcumulado;
  } else if (scenario === 'acordo') {
    avisoPrevio = dailyRate * avisoPrevioDias * 0.5;
    multaFgts = fgtsAcumulado * 0.2;
    saqueFgts = fgtsAcumulado * 0.8;
  }
  // pedido_demissao: sem aviso indenizado, sem multa FGTS, sem saque

  const components = [
    { key: 'saldoSalario', label: 'Saldo de salário', value: saldoSalario, description: `${saldoSalarioDias} dia(s) trabalhado(s) no mês.` },
    { key: 'decimoTerceiro', label: '13º salário proporcional', value: decimoTerceiro, description: `${mesesAno}/12 avos referentes a ${simDate.getFullYear()}.` },
    { key: 'feriasProporcionais', label: 'Férias proporcionais', value: feriasProporcionais, description: `${mesesAquisitivo}/12 avos do período aquisitivo atual.` },
    { key: 'tercoConstitucional', label: '1/3 constitucional sobre férias', value: tercoConstitucional, description: 'Um terço sobre as férias proporcionais.' },
    { key: 'avisoPrevio', label: 'Aviso prévio indenizado', value: avisoPrevio, description: scenario === 'pedido_demissao' ? 'Não devido — iniciativa do colaborador.' : `${scenario === 'acordo' ? avisoPrevioDias / 2 : avisoPrevioDias} dias (Lei 12.506/2011).` },
    { key: 'multaFgts', label: 'Multa FGTS', value: multaFgts, description: scenario === 'sem_justa_causa' ? '40% sobre o FGTS acumulado.' : scenario === 'acordo' ? '20% sobre o FGTS acumulado (acordo).' : 'Não devida — iniciativa do colaborador.' },
  ];

  const total = components.reduce((s, c) => s + c.value, 0);

  return {
    components,
    total,
    fgtsAcumulado,
    saqueFgts,
    tenureYears,
    avisoPrevioDias,
  };
}
