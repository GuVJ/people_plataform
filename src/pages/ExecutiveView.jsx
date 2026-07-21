import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import InsightCard from '../components/insights/InsightCard.jsx';
import ExecutiveSummaryTable from '../components/summary/ExecutiveSummaryTable.jsx';
import { buildExecutiveSummary } from '../data/executiveSummary.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

export default function ExecutiveView() {
  const { metrics, insights } = useData();
  const { targets } = useBudget();

  const summaryRows = useMemo(() => buildExecutiveSummary(metrics, targets), [metrics, targets]);
  const period = metrics.labels[metrics.labels.length - 1];

  const headcount = metrics.activeNow.length;
  const payroll = metrics.payrollSeries.at(-1).total;
  const turnover = metrics.turnoverSeries.at(-1).totalRate;
  const annualTurnoverCost = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Visão Executiva</h1>
          <p className="page-subtitle">Panorama para diretoria e board · fechamento de {period}</p>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
        <SectionCard title="Headcount ativo">
          <div className="stat-big">{formatNumber(headcount)}</div>
        </SectionCard>
        <SectionCard title="Folha mensal">
          <div className="stat-big">{formatCurrency(payroll, { compact: true })}</div>
        </SectionCard>
        <SectionCard title="Turnover mensal">
          <div className="stat-big">{formatPercent(turnover)}</div>
        </SectionCard>
        <SectionCard title="Custo de turnover (12m)">
          <div className="stat-big">{formatCurrency(annualTurnoverCost, { compact: true })}</div>
        </SectionCard>
      </div>

      <SectionCard title="Resumo executivo do mês">
        <ExecutiveSummaryTable rows={summaryRows} />
      </SectionCard>

      <div className="section-title" style={{ marginTop: 28 }}>
        <span>Insights automáticos</span>
        <span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>Gerados pelo Copiloto a partir dos dados do período</span>
      </div>
      <div className="grid grid-cols-3">
        {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
      </div>
    </div>
  );
}
