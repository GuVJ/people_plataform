import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import { formatCurrency, formatNumber, formatPercent, formatSigned, formatSignedCurrency } from '../utils/format.js';
import './Planning.css';

const ANNUAL_COST_MULTIPLIER = 1.65; // encargos, benefícios e provisões sobre o salário nominal
const REPLACEMENT_COST_FACTOR = 0.6;

export default function Planning() {
  const { metrics } = useData();
  const [headcountDelta, setHeadcountDelta] = useState(0);
  const [area, setArea] = useState('Todas as diretorias');
  const [turnoverChangePct, setTurnoverChangePct] = useState(0);

  const areaOptions = ['Todas as diretorias', ...metrics.headcountByArea.map((a) => a.area)];

  const impact = useMemo(() => {
    const baseHeadcount = metrics.activeNow.length;
    const basePayroll = metrics.payrollSeries.at(-1).total;
    const baseAvgSalary = basePayroll / (baseHeadcount || 1);

    const areaEmployees = area === 'Todas as diretorias' ? metrics.activeNow : metrics.activeNow.filter((e) => e.area === area);
    const areaAvgSalary = areaEmployees.length ? areaEmployees.reduce((s, e) => s + e.salary, 0) / areaEmployees.length : baseAvgSalary;

    const newHeadcount = Math.max(0, baseHeadcount + headcountDelta);
    const monthlyPayrollDelta = headcountDelta * areaAvgSalary;
    const newMonthlyPayroll = basePayroll + monthlyPayrollDelta;
    const annualPayrollDelta = monthlyPayrollDelta * 12 * ANNUAL_COST_MULTIPLIER;

    const last12Terms = metrics.terminationsSeries.slice(-12);
    const annualTerminations = last12Terms.reduce((s, t) => s + t.total, 0);
    const annualTurnoverCost = last12Terms.reduce((s, t) => s + t.cost, 0);
    const newAnnualTerminations = Math.max(0, annualTerminations * (1 + turnoverChangePct / 100));
    const newAnnualTurnoverCost = newAnnualTerminations * (annualTurnoverCost / (annualTerminations || 1));
    const turnoverCostDelta = newAnnualTurnoverCost - annualTurnoverCost;

    const productivityIndex = 100 + (headcountDelta / (baseHeadcount || 1)) * 55 - (turnoverChangePct > 0 ? turnoverChangePct * 0.35 : turnoverChangePct * 0.15);

    const totalAnnualBudgetDelta = annualPayrollDelta + turnoverCostDelta;

    return {
      baseHeadcount, newHeadcount, headcountDeltaPct: (headcountDelta / (baseHeadcount || 1)) * 100,
      basePayroll, newMonthlyPayroll, monthlyPayrollDelta, annualPayrollDelta,
      annualTerminations, newAnnualTerminations, annualTurnoverCost, newAnnualTurnoverCost, turnoverCostDelta,
      productivityIndex, totalAnnualBudgetDelta, areaAvgSalary,
    };
  }, [metrics, headcountDelta, area, turnoverChangePct]);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Workforce Planning</h1>
          <p className="page-subtitle">Simule cenários de contratação, redução e variação de turnover e veja o impacto imediato</p>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Cenário de contratação/redução">
          <label className="planning-label">Diretoria de referência (usada para calcular salário médio)</label>
          <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
            {areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <label className="planning-label" style={{ marginTop: 16 }}>
            {headcountDelta >= 0 ? 'Contratar' : 'Reduzir'} <strong>{formatNumber(Math.abs(headcountDelta))}</strong> colaboradores
          </label>
          <input
            type="range" min="-150" max="150" step="1" value={headcountDelta}
            onChange={(e) => setHeadcountDelta(Number(e.target.value))}
            className="planning-slider"
          />
          <div className="planning-slider-labels"><span>-150 (reduzir)</span><span>0</span><span>+150 (contratar)</span></div>

          <label className="planning-label" style={{ marginTop: 20 }}>
            Alterar turnover em <strong>{formatSigned(turnoverChangePct, 0, '%')}</strong>
          </label>
          <input
            type="range" min="-50" max="50" step="1" value={turnoverChangePct}
            onChange={(e) => setTurnoverChangePct(Number(e.target.value))}
            className="planning-slider"
          />
          <div className="planning-slider-labels"><span>-50% (reduzir)</span><span>0</span><span>+50% (aumentar)</span></div>
        </SectionCard>

        <SectionCard title="Resumo do cenário" subtitle={`Salário médio de referência: ${formatCurrency(impact.areaAvgSalary, { compact: true })}`}>
          <div className="planning-summary-grid">
            <div>
              <span className="planning-summary-label">Headcount projetado</span>
              <span className="planning-summary-value">{formatNumber(impact.newHeadcount)}</span>
              <span className={`planning-summary-delta ${headcountDelta >= 0 ? 'good' : 'bad'}`}>{formatSigned(impact.headcountDeltaPct, 1, '%')}</span>
            </div>
            <div>
              <span className="planning-summary-label">Folha mensal projetada</span>
              <span className="planning-summary-value">{formatCurrency(impact.newMonthlyPayroll, { compact: true })}</span>
              <span className={`planning-summary-delta ${impact.monthlyPayrollDelta <= 0 ? 'good' : 'bad'}`}>{formatSignedCurrency(impact.monthlyPayrollDelta)}</span>
            </div>
            <div>
              <span className="planning-summary-label">Desligamentos projetados (12m)</span>
              <span className="planning-summary-value">{formatNumber(impact.newAnnualTerminations, 0)}</span>
              <span className={`planning-summary-delta ${turnoverChangePct <= 0 ? 'good' : 'bad'}`}>{formatSigned(turnoverChangePct, 0, '%')}</span>
            </div>
            <div>
              <span className="planning-summary-label">Índice de produtividade</span>
              <span className="planning-summary-value">{formatNumber(impact.productivityIndex, 0)}</span>
              <span className="text-tertiary" style={{ fontSize: 11 }}>base 100</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-3">
        <SectionCard title="Impacto na folha (anual)">
          <div className={`stat-big ${impact.annualPayrollDelta > 0 ? 'value-bad' : 'value-good'}`}>{formatSignedCurrency(impact.annualPayrollDelta)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>considerando encargos e benefícios ({formatPercent((ANNUAL_COST_MULTIPLIER - 1) * 100)} sobre o salário nominal)</p>
        </SectionCard>
        <SectionCard title="Impacto no custo de turnover (anual)">
          <div className={`stat-big ${impact.turnoverCostDelta > 0 ? 'value-bad' : 'value-good'}`}>{formatSignedCurrency(impact.turnoverCostDelta)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>vs. custo atual de {formatCurrency(impact.annualTurnoverCost, { compact: true })}/ano</p>
        </SectionCard>
        <SectionCard title="Impacto total no orçamento (anual)">
          <div className={`stat-big ${impact.totalAnnualBudgetDelta > 0 ? 'value-bad' : 'value-good'}`}>{formatSignedCurrency(impact.totalAnnualBudgetDelta)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>folha + custo de turnover combinados</p>
        </SectionCard>
      </div>
    </div>
  );
}
