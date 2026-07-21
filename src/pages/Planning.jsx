import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import YearComparisonChart from '../components/ui/YearComparisonChart.jsx';
import CostBridge from '../components/ui/CostBridge.jsx';
import { addMonths, monthLabel } from '../utils/dates.js';
import { formatCurrency, formatNumber, formatPercent, formatSigned, formatSignedCurrency } from '../utils/format.js';
import './Planning.css';

const ANNUAL_COST_MULTIPLIER = 1.65; // encargos, benefícios e provisões sobre o salário nominal (Brasil, CLT)
const SEVERANCE_MONTHS = 1.8; // custo médio de rescisão por desligamento, em meses de salário (estimativa de planejamento)

// Cenários prontos — deltas relativos ao headcount atual, aplicados ao clicar.
const SCENARIOS = [
  { key: 'base', label: 'Base atual', hint: 'Sem mudanças', deltaPct: 0, merit: 0, turnover: 0 },
  { key: 'growth', label: 'Crescimento', hint: '+8% quadro · reajuste 6% · retenção', deltaPct: 8, merit: 6, turnover: -10 },
  { key: 'stable', label: 'Estável', hint: 'Repor saídas · reajuste 4%', deltaPct: 0, merit: 4, turnover: 0 },
  { key: 'contain', label: 'Contenção', hint: '-3% quadro · sem reajuste', deltaPct: -3, merit: 0, turnover: -5 },
  { key: 'reduce', label: 'Redução', hint: '-10% quadro', deltaPct: -10, merit: 0, turnover: 0 },
];

export default function Planning() {
  const { metrics } = useData();
  const [headcountDelta, setHeadcountDelta] = useState(0);
  const [meritPct, setMeritPct] = useState(0);
  const [turnoverChangePct, setTurnoverChangePct] = useState(0);
  const [area, setArea] = useState('Todas as diretorias');
  const [activeScenario, setActiveScenario] = useState('base');

  const areaOptions = ['Todas as diretorias', ...metrics.headcountByArea.map((a) => a.area)];
  const baseHeadcount = metrics.activeNow.length;

  function applyScenario(s) {
    setActiveScenario(s.key);
    setHeadcountDelta(Math.round((baseHeadcount * s.deltaPct) / 100));
    setMeritPct(s.merit);
    setTurnoverChangePct(s.turnover);
  }

  function onLeverChange(setter) {
    return (value) => { setter(value); setActiveScenario(null); };
  }

  const impact = useMemo(() => {
    const basePayroll = metrics.payrollSeries.at(-1).total;
    const baseAvgSalary = basePayroll / (baseHeadcount || 1);

    const areaEmployees = area === 'Todas as diretorias' ? metrics.activeNow : metrics.activeNow.filter((e) => e.area === area);
    const areaAvgSalary = areaEmployees.length ? areaEmployees.reduce((s, e) => s + e.salary, 0) / areaEmployees.length : baseAvgSalary;

    const targetHeadcount = Math.max(0, baseHeadcount + headcountDelta);

    // Supply x Demand x Gap (attrition-aware). Demand = quadro-alvo. Oferta = quem permanece
    // após as saídas esperadas no ano. Contratações necessárias = demanda − oferta.
    const last12Terms = metrics.terminationsSeries.slice(-12);
    const annualTerminations = last12Terms.reduce((s, t) => s + t.total, 0);
    const annualTurnoverCost = last12Terms.reduce((s, t) => s + t.cost, 0);
    const costPerTermination = annualTerminations ? annualTurnoverCost / annualTerminations : 0;

    const projTerminations = Math.max(0, Math.round(annualTerminations * (1 + turnoverChangePct / 100)));
    const supply = baseHeadcount - projTerminations;
    const demand = targetHeadcount;
    const gap = demand - supply; // >0 = contratar; <0 = excedente (redução além da atrição)
    const hiresNeeded = Math.max(0, gap);
    const layoffs = Math.max(0, -gap);

    // Folha carregada (anual) — decomposta em efeito de headcount e efeito de reajuste.
    const baseAnnualLoaded = basePayroll * 12 * ANNUAL_COST_MULTIPLIER;
    const headcountEffect = (targetHeadcount - baseHeadcount) * baseAvgSalary * 12 * ANNUAL_COST_MULTIPLIER;
    const meritEffect = targetHeadcount * baseAvgSalary * (meritPct / 100) * 12 * ANNUAL_COST_MULTIPLIER;
    const projAnnualLoaded = baseAnnualLoaded + headcountEffect + meritEffect;
    const newMonthlyPayroll = projAnnualLoaded / (12 * ANNUAL_COST_MULTIPLIER);

    const projTurnoverCost = projTerminations * costPerTermination;
    const turnoverCostDelta = projTurnoverCost - annualTurnoverCost;
    const severanceCost = layoffs * areaAvgSalary * SEVERANCE_MONTHS;

    const productivityIndex = 100 + (headcountDelta / (baseHeadcount || 1)) * 55 - (turnoverChangePct > 0 ? turnoverChangePct * 0.35 : turnoverChangePct * 0.15);

    const baseBudget = baseAnnualLoaded + annualTurnoverCost;
    const projBudget = projAnnualLoaded + projTurnoverCost;
    const totalAnnualBudgetDelta = projBudget - baseBudget;

    return {
      baseHeadcount, targetHeadcount, headcountDeltaPct: (headcountDelta / (baseHeadcount || 1)) * 100,
      basePayroll, newMonthlyPayroll, monthlyPayrollDelta: newMonthlyPayroll - basePayroll,
      annualPayrollDelta: projAnnualLoaded - baseAnnualLoaded, headcountEffect, meritEffect,
      annualTerminations, projTerminations, annualTurnoverCost, turnoverCostDelta, severanceCost,
      supply, demand, gap, hiresNeeded, layoffs,
      productivityIndex, totalAnnualBudgetDelta, areaAvgSalary, baseAvgSalary,
      baseBudget, projBudget, baseAnnualLoaded,
    };
  }, [metrics, headcountDelta, meritPct, area, turnoverChangePct, baseHeadcount]);

  // Projeção de headcount — 12 meses à frente. "Sem ação" só sofre atrição; "Cenário" caminha
  // linearmente até o quadro-alvo.
  const projection = useMemo(() => {
    const lastMonth = metrics.months[metrics.months.length - 1];
    const labels = Array.from({ length: 12 }, (_, i) => monthLabel(addMonths(lastMonth, i + 1)));
    const monthlyAttrition = impact.projTerminations / 12;
    const semAcao = labels.map((_, i) => Math.round(baseHeadcount - monthlyAttrition * (i + 1)));
    const cenario = labels.map((_, i) => Math.round(baseHeadcount + (headcountDelta / 12) * (i + 1)));
    return { labels, semAcao, cenario };
  }, [metrics.months, baseHeadcount, headcountDelta, impact.projTerminations]);

  const bridgeSteps = [
    { label: 'Custo atual', value: impact.baseBudget, kind: 'base' },
    { label: 'Crescimento de headcount', value: impact.headcountEffect, kind: 'delta' },
    { label: 'Reajuste salarial', value: impact.meritEffect, kind: 'delta' },
    { label: 'Variação de turnover', value: impact.turnoverCostDelta, kind: 'delta' },
    { label: 'Custo projetado', value: impact.projBudget, kind: 'total' },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Workforce Planning</h1>
          <p className="page-subtitle">Simule cenários de quadro, reajuste e turnover — com análise de gap, projeção de 12 meses e impacto no orçamento</p>
        </div>
      </div>

      <div className="planning-scenarios">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`planning-scenario${activeScenario === s.key ? ' active' : ''}`}
            onClick={() => applyScenario(s)}
          >
            <span className="planning-scenario-label">{s.label}</span>
            <span className="planning-scenario-hint">{s.hint}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Alavancas do cenário">
          <label className="planning-label">Diretoria de referência (base do salário médio)</label>
          <select className="planning-select" value={area} onChange={(e) => setArea(e.target.value)}>
            {areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <label className="planning-label" style={{ marginTop: 18 }}>
            {headcountDelta >= 0 ? 'Crescer' : 'Reduzir'} o quadro em <strong>{formatNumber(Math.abs(headcountDelta))}</strong> ({formatSigned(impact.headcountDeltaPct, 1, '%')})
          </label>
          <input type="range" min="-400" max="400" step="5" value={headcountDelta}
            onChange={(e) => onLeverChange(setHeadcountDelta)(Number(e.target.value))} className="planning-slider" />
          <div className="planning-slider-labels"><span>−400</span><span>0</span><span>+400</span></div>

          <label className="planning-label" style={{ marginTop: 18 }}>
            Reajuste salarial médio de <strong>{formatPercent(meritPct)}</strong>
          </label>
          <input type="range" min="0" max="15" step="0.5" value={meritPct}
            onChange={(e) => onLeverChange(setMeritPct)(Number(e.target.value))} className="planning-slider" />
          <div className="planning-slider-labels"><span>0%</span><span>7,5%</span><span>15%</span></div>

          <label className="planning-label" style={{ marginTop: 18 }}>
            Alterar turnover em <strong>{formatSigned(turnoverChangePct, 0, '%')}</strong>
          </label>
          <input type="range" min="-50" max="50" step="1" value={turnoverChangePct}
            onChange={(e) => onLeverChange(setTurnoverChangePct)(Number(e.target.value))} className="planning-slider" />
          <div className="planning-slider-labels"><span>−50% (reter)</span><span>0</span><span>+50%</span></div>
        </SectionCard>

        <SectionCard title="Resumo do cenário" subtitle={`Salário médio de referência: ${formatCurrency(impact.areaAvgSalary, { compact: true })} · horizonte de 12 meses`}>
          <div className="planning-summary-grid">
            <div>
              <span className="planning-summary-label">Headcount-alvo</span>
              <span className="planning-summary-value">{formatNumber(impact.targetHeadcount)}</span>
              <span className={`planning-summary-delta ${headcountDelta >= 0 ? 'up' : 'down'}`}>{formatSigned(impact.headcountDeltaPct, 1, '%')}</span>
            </div>
            <div>
              <span className="planning-summary-label">Folha mensal projetada</span>
              <span className="planning-summary-value">{formatCurrency(impact.newMonthlyPayroll, { compact: true })}</span>
              <span className={`planning-summary-delta ${impact.monthlyPayrollDelta <= 0 ? 'down' : 'up'}`}>{formatSignedCurrency(impact.monthlyPayrollDelta)}</span>
            </div>
            <div>
              <span className="planning-summary-label">Desligamentos projetados (12m)</span>
              <span className="planning-summary-value">{formatNumber(impact.projTerminations)}</span>
              <span className={`planning-summary-delta ${turnoverChangePct <= 0 ? 'down' : 'up'}`}>{formatSigned(turnoverChangePct, 0, '%')}</span>
            </div>
            <div>
              <span className="planning-summary-label">Índice de produtividade</span>
              <span className="planning-summary-value">{formatNumber(impact.productivityIndex, 0)}</span>
              <span className="text-tertiary" style={{ fontSize: 11 }}>base 100</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Projeção de headcount" subtitle="Próximos 12 meses · sem ação (só atrição) vs. cenário">
          <YearComparisonChart
            monthLabels={projection.labels}
            series={[
              { year: 'semAcao', label: 'Sem ação', color: 'var(--color-year-previous)', values: projection.semAcao },
              { year: 'cenario', label: 'Cenário', color: 'var(--color-year-current)', values: projection.cenario },
            ]}
            target={{ label: `Alvo ${formatNumber(impact.targetHeadcount)}`, values: projection.labels.map(() => impact.targetHeadcount) }}
            formatValue={(v) => formatNumber(v, 0)}
          />
        </SectionCard>

        <SectionCard title="Oferta × Demanda × Gap" subtitle="Quantas contratações o cenário exige, já descontando a atrição esperada">
          <div className="planning-gap">
            <div className="planning-gap-row">
              <span className="planning-gap-label">Oferta projetada</span>
              <span className="planning-gap-desc">quadro atual − saídas esperadas ({formatNumber(impact.projTerminations)})</span>
              <span className="planning-gap-value">{formatNumber(impact.supply)}</span>
            </div>
            <div className="planning-gap-row">
              <span className="planning-gap-label">Demanda (quadro-alvo)</span>
              <span className="planning-gap-desc">headcount desejado ao fim do período</span>
              <span className="planning-gap-value">{formatNumber(impact.demand)}</span>
            </div>
            <div className="planning-gap-highlight">
              {impact.hiresNeeded > 0 ? (
                <>
                  <span className="planning-gap-big">{formatNumber(impact.hiresNeeded)}</span>
                  <span className="planning-gap-big-label">contratações necessárias no período</span>
                </>
              ) : impact.layoffs > 0 ? (
                <>
                  <span className="planning-gap-big warn">{formatNumber(impact.layoffs)}</span>
                  <span className="planning-gap-big-label">reduções além da atrição natural (excedente)</span>
                </>
              ) : (
                <>
                  <span className="planning-gap-big">0</span>
                  <span className="planning-gap-big-label">a atrição natural já equilibra o quadro-alvo</span>
                </>
              )}
            </div>
            {impact.layoffs > 0 && (
              <p className="text-tertiary" style={{ fontSize: 11.5, marginTop: 10 }}>
                Custo estimado de rescisão das reduções: <strong>{formatCurrency(impact.severanceCost, { compact: true })}</strong> (one-time, ~{SEVERANCE_MONTHS} salários por saída).
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title="Ponte de custo anual" subtitle="Do orçamento atual de pessoas ao projetado — folha carregada + custo de turnover">
          <CostBridge steps={bridgeSteps} formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-3">
        <SectionCard title="Impacto na folha (anual)">
          <div className={`stat-big ${impact.annualPayrollDelta > 0 ? 'value-bad' : 'value-good'}`}>{formatSignedCurrency(impact.annualPayrollDelta)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>carregada com encargos e benefícios ({formatPercent((ANNUAL_COST_MULTIPLIER - 1) * 100)} sobre o salário)</p>
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
