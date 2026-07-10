export function sparklineForKpi(metrics, key) {
  const tail = (arr, fn) => arr.slice(-12).map(fn);
  switch (key) {
    case 'headcount': return tail(metrics.headcountSeries, (s) => s.total);
    case 'admissoes': return tail(metrics.admissionsSeries, (s) => s.total);
    case 'desligamentos': return tail(metrics.terminationsSeries, (s) => s.total);
    case 'turnover': return tail(metrics.turnoverSeries, (s) => s.totalRate);
    case 'absenteismo': return tail(metrics.absenteeismSeries, (s) => s.rate);
    case 'horasExtras': return tail(metrics.overtimeSeries, (s) => s.cost);
    case 'custoPessoal': return tail(metrics.payrollSeries, (s) => s.total);
    case 'diversidade': return tail(metrics.diversityWomenSeries, (s) => s.pct);
    case 'tempoContratacao': return metrics.recruitment.timeToHireSeries.map((s) => s.days);
    case 'tempoEmpresa': return tail(metrics.tenureSeries, (s) => s.years);
    default: return [];
  }
}
