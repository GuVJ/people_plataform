import { average } from '../utils/stats.js';
import { monthKey } from '../utils/dates.js';

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
    promotionsCount: team.reduce((s, e) => s + e.promotions, 0),
    avgTrainingHours: average(team, (e) => e.trainingHoursYear),
  };
}
