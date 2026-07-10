import { average, quantile, pctChange } from '../utils/stats.js';

// Contextualizes an employee's raw numbers against their peers — a salary or engagement
// figure only means something next to what "normal" looks like for that area/company.
export function buildEmployeeBenchmark({ employee, riskEntry, activeNow, risk }) {
  const areaPeers = activeNow.filter((e) => e.area === employee.area);
  const evaluatedAreaPeers = areaPeers.filter((e) => e.performanceScore !== null);

  const salaryMedian = quantile(areaPeers.map((e) => e.salary), 0.5);
  const engagementAvgArea = average(areaPeers, (e) => e.engagementScore);
  const engagementAvgCompany = average(activeNow, (e) => e.engagementScore);
  const tenureAvgArea = average(areaPeers, (e) => e.tenureYears);
  const performanceAvgArea = evaluatedAreaPeers.length ? average(evaluatedAreaPeers, (e) => e.performanceScore) : null;

  let riskPercentile = null;
  if (riskEntry) {
    const areaRiskScores = risk.filter((r) => r.area === employee.area).map((r) => r.score);
    const below = areaRiskScores.filter((s) => s <= riskEntry.score).length;
    riskPercentile = Math.round((below / (areaRiskScores.length || 1)) * 100);
  }

  return {
    salary: {
      value: employee.salary,
      reference: salaryMedian,
      diffPct: pctChange(employee.salary, salaryMedian),
    },
    engagement: {
      value: employee.engagementScore,
      referenceArea: engagementAvgArea,
      referenceCompany: engagementAvgCompany,
      diffPct: pctChange(employee.engagementScore, engagementAvgCompany),
    },
    performance: performanceAvgArea === null || employee.performanceScore === null ? null : {
      value: employee.performanceScore,
      reference: performanceAvgArea,
      diffPct: pctChange(employee.performanceScore, performanceAvgArea),
    },
    tenure: {
      value: employee.tenureYears,
      reference: tenureAvgArea,
      diffPct: pctChange(employee.tenureYears, tenureAvgArea),
    },
    riskPercentile,
    areaPeerCount: areaPeers.length,
  };
}
