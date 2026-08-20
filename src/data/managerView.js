import { average } from '../utils/stats.js';
import { monthKey, monthLabel, endOfMonth } from '../utils/dates.js';

const RECENT_MONTHS = 3;

// Everything a manager needs to know about their own team — scoped entirely to direct
// reports, never company-wide numbers. Mirrors deriveMetrics.js in spirit but much smaller.
export function buildManagerView({ managerId, employees, risk, months, referenceDate }) {
  const manager = employees.find((e) => e.id === managerId);
  if (!manager) return null;

  const team = employees.filter((e) => e.managerId === managerId && e.status === 'Ativo');
  const riskById = new Map(risk.map((r) => [r.id, r]));
  const teamRisk = team.map((e) => riskById.get(e.id)).filter(Boolean);

  const twelveMonthsAgo = months[Math.max(0, months.length - 12)];
  const terminatedLast12 = employees.filter((e) => e.managerId === managerId && e.terminationDate && e.terminationDate >= twelveMonthsAgo);
  const turnoverRate = (terminatedLast12.length / (team.length + terminatedLast12.length || 1)) * 100;

  const recentKeys = months.slice(-RECENT_MONTHS).map((m) => monthKey(m));
  const avgAbsenceDays = average(team, (e) => {
    const total = recentKeys.reduce((s, k) => s + (e.monthlyAbsence.get(k)?.days ?? 0), 0);
    return total / RECENT_MONTHS;
  });
  const avgOvertimeHours = average(team, (e) => {
    const total = recentKeys.reduce((s, k) => s + (e.monthlyOvertime.get(k) ?? 0), 0);
    return total / RECENT_MONTHS;
  });

  const performanceDistribution = ['Baixo', 'Médio', 'Alto', 'Não avaliado'].map((bucket) => ({
    label: bucket, count: team.filter((e) => e.performanceBucket === bucket).length,
  })).filter((b) => b.count > 0);

  const riskDistribution = ['Baixo', 'Médio', 'Alto', 'Muito Alto'].map((level) => ({
    label: level, count: teamRisk.filter((r) => r.level === level).length,
  }));

  const nineBoxGrid = [];
  for (const potential of ['Alto', 'Médio', 'Baixo']) {
    for (const performance of ['Baixo', 'Médio', 'Alto']) {
      nineBoxGrid.push({ potential, performance, count: team.filter((e) => e.potential === potential && e.performanceBucket === performance).length });
    }
  }

  const criticalTalents = team.filter((e) => e.performanceBucket === 'Alto' && e.potential === 'Alto');
  const highRisk = teamRisk.filter((r) => r.level === 'Alto' || r.level === 'Muito Alto');

  // Série mensal (12 meses) escopada aos reportes do gestor — inclui desligados para
  // reconstruir headcount, admissões e demissões de cada mês.
  const allReports = employees.filter((e) => e.managerId === managerId);
  const movementSeries = months.slice(-12).map((m) => {
    const key = monthKey(m);
    const end = endOfMonth(m);
    return {
      label: monthLabel(m),
      admissions: allReports.filter((e) => monthKey(e.admissionDate) === key).length,
      terminations: allReports.filter((e) => e.terminationDate && monthKey(e.terminationDate) === key).length,
      headcount: allReports.filter((e) => e.admissionDate <= end && (!e.terminationDate || e.terminationDate > end)).length,
    };
  });

  const roster = team.map((e) => ({
    ...e,
    risk: riskById.get(e.id) ?? null,
    recentAbsenceDays: recentKeys.reduce((s, k) => s + (e.monthlyAbsence.get(k)?.days ?? 0), 0),
    recentOvertimeHours: recentKeys.reduce((s, k) => s + (e.monthlyOvertime.get(k) ?? 0), 0),
  })).sort((a, b) => (b.risk?.score ?? 0) - (a.risk?.score ?? 0));

  return {
    manager,
    team,
    roster,
    headcount: team.length,
    avgEngagement: average(team, (e) => e.engagementScore),
    avgClimate: average(team, (e) => e.climateScore),
    avgTenureYears: average(team, (e) => e.tenureYears),
    turnoverRate,
    terminatedLast12,
    avgAbsenceDays,
    avgOvertimeHours,
    performanceDistribution,
    riskDistribution,
    nineBoxGrid,
    criticalTalents,
    highRisk,
    movementSeries,
    promotionsCount: team.reduce((s, e) => s + e.promotions, 0),
    avgTrainingHours: average(team, (e) => e.trainingHoursYear),
  };
}
