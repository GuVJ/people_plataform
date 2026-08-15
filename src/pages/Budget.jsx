import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import YearComparisonChart from '../components/ui/YearComparisonChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { buildYearComparison, buildRampTarget, buildFlatTarget } from '../data/yearComparison.js';
import { buildPeopleCostBreakdown } from '../data/peopleCostBreakdown.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import './Budget.css';

function StatusBadge({ ok, label }) {
  return <span className={`badge ${ok ? 'badge-success' : 'badge-warning'}`}>{label}</span>;
}

export default function Budget() {
  const { tx, lang } = useLang();
  const { metrics } = useData();
  const { targets } = useBudget();

  const yearComparison = useMemo(() => buildYearComparison(metrics), [metrics]);
  // `lang` na dependência: as descrições usam pick() e precisam recompor ao trocar de idioma.
  const costBreakdown = useMemo(() => buildPeopleCostBreakdown(metrics), [metrics, lang]);

  if (!targets) return null;

  const t2026 = targets[2026];
  const t2025 = targets[2025];

  const monthIdx = yearComparison.lastCompleteIndex(yearComparison.headcount[2026]);
  const currentHeadcount = yearComparison.headcount[2026][monthIdx];
  const currentPeopleCost = yearComparison.peopleCostCumulative[2026][monthIdx];
  const currentTurnover = yearComparison.turnoverCumulativePct[2026][monthIdx];
  const currentOvertime = yearComparison.overtimeCostCumulative[2026][monthIdx];

  const headcountTargetLine = buildFlatTarget(t2026.headcountTarget);
  const peopleCostTargetLine = buildRampTarget(t2026.peopleCostTarget);
  const turnoverTargetLine = buildRampTarget(t2026.turnoverTarget);
  const overtimeTargetLine = buildRampTarget(t2026.overtimeCostTarget);

  const expectedPeopleCostPace = peopleCostTargetLine[monthIdx];
  const expectedTurnoverPace = turnoverTargetLine[monthIdx];
  const expectedOvertimePace = overtimeTargetLine[monthIdx];

  const seriesFor = (metricKey) => [
    { year: 2025, label: '2025', color: 'var(--color-year-previous)', values: yearComparison[metricKey][2025] },
    { year: 2026, label: '2026', color: 'var(--color-year-current)', values: yearComparison[metricKey][2026] },
  ];

  const exportRows = costBreakdown.categories.map((c) => ({
    Categoria: c.label, 'Custo mensal': c.monthly.toFixed(2), 'Custo anual': (c.monthly * 12).toFixed(2), '% do total': c.pct.toFixed(1),
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Orçamento')}</h1>
          <p className="page-subtitle">{tx('Headcount, custo de pessoas, turnover e horas extras — real vs. meta, 2025 e 2026')}</p>
        </div>
        <Link to="/orcamento/metas" className="btn btn-primary">{tx('Editar metas')}</Link>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
        <SectionCard title="Headcount" subtitle={`${tx('Meta')} ${formatNumber(t2026.headcountTarget)}`}>
          <div className="stat-big">{formatNumber(currentHeadcount)}</div>
          <StatusBadge ok={currentHeadcount <= t2026.headcountTarget * 1.05} label={currentHeadcount <= t2026.headcountTarget ? tx('Dentro da meta') : tx('Acima da meta')} />
        </SectionCard>
        <SectionCard title={tx('Custo de pessoas (YTD)')} subtitle={`${tx('Meta anual')} ${formatCurrency(t2026.peopleCostTarget, { compact: true })}`}>
          <div className="stat-big">{formatCurrency(currentPeopleCost, { compact: true })}</div>
          <StatusBadge ok={currentPeopleCost <= expectedPeopleCostPace} label={currentPeopleCost <= expectedPeopleCostPace ? tx('No ritmo do orçamento') : tx('Acima do ritmo')} />
        </SectionCard>
        <SectionCard title="Turnover (YTD)" subtitle={`${tx('Meta anual')} ${formatPercent(t2026.turnoverTarget)}`}>
          <div className="stat-big">{formatPercent(currentTurnover)}</div>
          <StatusBadge ok={currentTurnover <= expectedTurnoverPace} label={currentTurnover <= expectedTurnoverPace ? tx('No ritmo do orçamento') : tx('Acima do ritmo')} />
        </SectionCard>
        <SectionCard title={tx('Horas extras (YTD)')} subtitle={`${tx('Meta anual')} ${formatCurrency(t2026.overtimeCostTarget, { compact: true })}`}>
          <div className="stat-big">{formatCurrency(currentOvertime, { compact: true })}</div>
          <StatusBadge ok={currentOvertime <= expectedOvertimePace} label={currentOvertime <= expectedOvertimePace ? tx('No ritmo do orçamento') : tx('Acima do ritmo')} />
        </SectionCard>
      </div>

      <div className="section-title"><span>{tx('Custo de pessoas por tipo')}</span></div>
      <div className="grid grid-cols-2" style={{ marginBottom: 24 }}>
        <SectionCard title={tx('Composição do custo mensal')} subtitle={`${tx('Total')}: ${formatCurrency(costBreakdown.totalMonthly, { compact: true })}/${tx('mês')} · ${formatCurrency(costBreakdown.totalAnnual, { compact: true })}/${tx('ano')}`}>
          <BarChart
            data={costBreakdown.categories}
            valueKey="monthly" labelKey="label"
            formatValue={(v) => formatCurrency(v, { compact: true })}
          />
        </SectionCard>
        <SectionCard title={tx('O que compõe cada categoria')} action={<ExportButton filename="composicao_custo_pessoas" sheetName="Custo de Pessoas" rows={exportRows} />}>
          <div className="budget-cost-list">
            {costBreakdown.categories.map((c) => (
              <div className="budget-cost-item" key={c.key}>
                <div className="budget-cost-item-top">
                  <span className="budget-cost-item-label">{tx(c.label)}</span>
                  <span className="budget-cost-item-value">{formatCurrency(c.monthly, { compact: true })}/{tx('mês')} · {formatPercent(c.pct)}</span>
                </div>
                <p className="budget-cost-item-desc">{tx(c.description)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="section-title"><span>{tx('Comparativo anual — 2025 vs. 2026')}</span></div>
      <div className="grid grid-cols-2">
        <SectionCard title="Headcount" subtitle={tx('Nível mensal · meta = linha pontilhada')}>
          <YearComparisonChart
            monthLabels={yearComparison.monthLabels}
            series={seriesFor('headcount')}
            target={{ label: `${tx('Meta')} ${formatNumber(t2026.headcountTarget)}`, values: headcountTargetLine }}
            formatValue={(v) => formatNumber(v, 0)}
          />
        </SectionCard>
        <SectionCard title={tx('Custo de pessoas')} subtitle={tx('Acumulado no ano (R$) · meta = linha pontilhada')}>
          <YearComparisonChart
            monthLabels={yearComparison.monthLabels}
            series={seriesFor('peopleCostCumulative')}
            target={{ label: tx('Meta'), values: peopleCostTargetLine }}
            formatValue={(v) => formatCurrency(v, { compact: true })}
          />
        </SectionCard>
        <SectionCard title="Turnover" subtitle={tx('Acumulado no ano (%) · meta = linha pontilhada')}>
          <YearComparisonChart
            monthLabels={yearComparison.monthLabels}
            series={seriesFor('turnoverCumulativePct')}
            target={{ label: tx('Meta'), values: turnoverTargetLine }}
            formatValue={(v) => formatPercent(v)}
          />
        </SectionCard>
        <SectionCard title={tx('Horas extras')} subtitle={tx('Custo acumulado no ano (R$) · meta = linha pontilhada')}>
          <YearComparisonChart
            monthLabels={yearComparison.monthLabels}
            series={seriesFor('overtimeCostCumulative')}
            target={{ label: tx('Meta'), values: overtimeTargetLine }}
            formatValue={(v) => formatCurrency(v, { compact: true })}
          />
        </SectionCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard title={tx('Como 2025 fechou vs. a meta daquele ano')}>
          <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.7 }}>
            Headcount: {formatNumber(yearComparison.headcount[2025].at(-1) ?? 0)} ({tx('meta')} {formatNumber(t2025.headcountTarget)}) ·{' '}
            {tx('Custo de pessoas')}: {formatCurrency(yearComparison.peopleCostCumulative[2025].at(-1) ?? 0, { compact: true })} ({tx('meta')} {formatCurrency(t2025.peopleCostTarget, { compact: true })}) ·{' '}
            Turnover: {formatPercent(yearComparison.turnoverCumulativePct[2025].at(-1) ?? 0)} ({tx('meta')} {formatPercent(t2025.turnoverTarget)}) ·{' '}
            {tx('Horas extras')}: {formatCurrency(yearComparison.overtimeCostCumulative[2025].at(-1) ?? 0, { compact: true })} ({tx('meta')} {formatCurrency(t2025.overtimeCostTarget, { compact: true })})
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
