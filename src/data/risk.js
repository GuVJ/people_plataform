import { groupBy, average, clamp } from '../utils/stats.js';
import { diffInYears } from '../utils/dates.js';

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function recentAverage(map, keys) {
  const vals = keys.map((k) => map.get(k)).filter((v) => v !== undefined);
  const nums = vals.map((v) => (typeof v === 'object' ? v.days : v));
  return average(nums);
}

export function computeRiskForEmployees(activeNow, months) {
  const byArea = groupBy(activeNow, (e) => e.area);
  const areaSalaryMedian = new Map();
  for (const [area, list] of byArea) areaSalaryMedian.set(area, median(list.map((e) => e.salary)));

  const recentKeys = months.slice(-3).map((m) => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  const referenceDate = months[months.length - 1];

  return activeNow.map((e) => {
    const factors = [];
    let score = 20;

    const tenureYears = diffInYears(e.admissionDate, referenceDate);
    if (tenureYears < 1) {
      score += 14;
      factors.push({ label: 'Menos de 1 ano de casa', impact: 14 });
    } else if (tenureYears > 6) {
      score -= 6;
      factors.push({ label: 'Alta antiguidade (retenção)', impact: -6 });
    }

    if (e.engagementScore < 55) {
      score += 22;
      factors.push({ label: 'Engajamento baixo', impact: 22 });
    } else if (e.engagementScore > 80) {
      score -= 10;
      factors.push({ label: 'Engajamento alto', impact: -10 });
    }

    if (e.climateScore < 3) {
      score += 12;
      factors.push({ label: 'Satisfação baixa na pesquisa de clima', impact: 12 });
    }

    const medianSalary = areaSalaryMedian.get(e.area) || e.salary;
    const salaryGapPct = ((e.salary - medianSalary) / (medianSalary || 1)) * 100;
    if (salaryGapPct < -12) {
      score += 16;
      factors.push({ label: 'Salário abaixo da mediana da diretoria', impact: 16 });
    } else if (salaryGapPct > 15) {
      score -= 5;
      factors.push({ label: 'Salário acima da mediana da diretoria', impact: -5 });
    }

    const recentOvertime = recentAverage(e.monthlyOvertime, recentKeys);
    if (recentOvertime > 20) {
      score += 14;
      factors.push({ label: 'Excesso de horas extras recorrente', impact: 14 });
    }

    const recentAbsence = recentAverage(e.monthlyAbsence, recentKeys);
    if (recentAbsence > 2) {
      score += 10;
      factors.push({ label: 'Aumento de absenteísmo recente', impact: 10 });
    }

    if (e.performanceBucket === 'Alto' && e.potential === 'Alto' && e.engagementScore < 70) {
      score += 15;
      factors.push({ label: 'Talento crítico com sinais de insatisfação', impact: 15 });
    }

    if (e.promotions === 0 && tenureYears > 3) {
      score += 8;
      factors.push({ label: 'Sem promoções há mais de 3 anos', impact: 8 });
    }

    score = clamp(Math.round(score), 2, 98);
    const level = score < 30 ? 'Baixo' : score < 55 ? 'Médio' : score < 75 ? 'Alto' : 'Muito Alto';

    factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return {
      id: e.id, name: e.name, area: e.area, roleLevel: e.roleLevel, managerName: e.managerName,
      tenureYears, engagementScore: e.engagementScore, performanceBucket: e.performanceBucket, potential: e.potential,
      score, level, factors: factors.slice(0, 4),
    };
  }).sort((a, b) => b.score - a.score);
}

export const RISK_LEVEL_COLOR = {
  'Baixo': 'success',
  'Médio': 'info',
  'Alto': 'warning',
  'Muito Alto': 'danger',
};
