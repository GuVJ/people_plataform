import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import HeatmapTable from '../components/ui/HeatmapTable.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import DashboardFilters from '../components/ui/DashboardFilters.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { OVERTIME_COST_TYPES } from '../data/constants.js';
import { formatNumber, formatCurrency, formatPercent } from '../utils/format.js';
import './Overtime.css';

export default function Overtime() {
  const { tx } = useLang();
  const { metrics } = useDashboardData();
  const series = metrics.overtimeSeries;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const payroll = metrics.payrollSeries[metrics.payrollSeries.length - 1].total;
  const pctOfPayroll = (last.cost / (payroll || 1)) * 100;
  const history = series.slice(-12).map((s) => ({ label: s.label, y: s.cost }));
  const annualCost = series.slice(-12).reduce((s, o) => s + o.cost, 0);

  // Decompõe o custo total de HE (mês corrente e acumulado 12m) nos tipos da CLT, usando as
  // proporções de referência de cada tipo. É uma estimativa de composição sobre o custo real já calculado.
  const byType = useMemo(
    () => OVERTIME_COST_TYPES.map((t) => ({
      ...t,
      monthly: last.cost * t.share,
      annual: annualCost * t.share,
      pct: t.share * 100,
    })),
    [last.cost, annualCost],
  );

  // Evolução mês a mês empilhada por tipo (custo mensal × proporção de cada tipo da CLT).
  const TYPE_COLORS = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)', 'var(--chart-2)'];
  const typeSeries = OVERTIME_COST_TYPES.map((t, i) => ({ key: t.key, label: t.label, color: TYPE_COLORS[i % TYPE_COLORS.length] }));
  const typeSeriesDesc = Object.fromEntries(OVERTIME_COST_TYPES.map((t) => [t.key, t.description]));
  const monthlyByType = series.slice(-12).map((m) => ({
    label: m.label,
    total: m.cost,
    values: Object.fromEntries(OVERTIME_COST_TYPES.map((t) => [t.key, m.cost * t.share])),
  }));

  const exportRows = byType.map((t) => ({
    Tipo: t.label,
    'Custo no mês': t.monthly.toFixed(2),
    'Custo 12 meses': t.annual.toFixed(2),
    '% do total': t.pct.toFixed(1),
    Descrição: t.description,
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Horas Extras')}</h1>
          <p className="page-subtitle">{tx('Evolução, composição por tipo e ranking por diretoria e gestor')}</p>
        </div>
        <ExportButton filename="horas_extras_por_tipo" sheetName="Horas Extras" rows={exportRows} />
      </div>

      <DashboardFilters />

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Custo de horas extras (mês)')}>
          <div className="stat-big">{formatCurrency(last.cost, { compact: true })}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {last.cost >= prev.cost ? '↑' : '↓'} {formatCurrency(Math.abs(last.cost - prev.cost), { compact: true })} {tx('vs. mês anterior')}
          </p>
        </SectionCard>
        <SectionCard title={tx('Horas extras (mês)')}>
          <div className="stat-big">{formatNumber(last.hours)}h</div>
        </SectionCard>
        <SectionCard title={tx('% da folha de pagamento')}>
          <div className="stat-big">{formatPercent(pctOfPayroll)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('benchmark de mercado:')} {formatPercent(metrics.benchmark.overtimeCostPctPayroll)}</p>
        </SectionCard>
        <SectionCard title={tx('Custo acumulado (12 meses)')}>
          <div className="stat-big">{formatCurrency(annualCost, { compact: true })}</div>
        </SectionCard>
      </div>

      <div className="section-title"><span>{tx('Composição do custo por tipo de hora extra')}</span></div>
      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Custo no mês por tipo')} subtitle={`${tx('Total:')} ${formatCurrency(last.cost, { compact: true })}`}>
          <BarChart
            data={byType}
            valueKey="monthly" labelKey="label"
            formatValue={(v) => formatCurrency(v, { compact: true })}
          />
        </SectionCard>
        <SectionCard title={tx('O que compõe cada tipo')}>
          <div className="overtime-type-list">
            {byType.map((t) => (
              <div className="overtime-type-item" key={t.key}>
                <div className="overtime-type-top">
                  <span className="overtime-type-label">{tx(t.label)}</span>
                  <span className="overtime-type-value">{formatCurrency(t.monthly, { compact: true })}{tx('/mês')} · {formatPercent(t.pct)}</span>
                </div>
                <p className="overtime-type-desc">{tx(t.description)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard
          title={tx('Evolução mensal por tipo de hora extra')}
          subtitle={tx('Composição do custo mês a mês (últimos 12 meses)')}
          info="Cada barra é o custo total de HE do mês, empilhado pela proporção de cada tipo da CLT. Passe o mouse num segmento para ver o valor e a descrição do tipo."
        >
          <StackedBarChart
            data={monthlyByType}
            series={typeSeries}
            seriesDesc={typeSeriesDesc}
            height={260}
            formatValue={(v) => formatCurrency(v, { compact: true })}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Evolução do custo de horas extras')} subtitle={tx('Últimos 12 meses')}>
          <LineChart history={history} formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
        <SectionCard title={tx('Custo de horas extras por diretoria')} subtitle={tx('Matriz mês a mês (12 meses)')}>
          <HeatmapTable rows={metrics.overtimeByAreaMonthly.rows} cols={metrics.overtimeByAreaMonthly.cols} formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Ranking de gestores')} subtitle={tx('Horas acumuladas do time (24 meses) — top 8')}>
          <BarChart data={metrics.overtimeByManager} valueKey="hours" labelKey="manager" color="var(--color-navy)" formatValue={(v) => `${formatNumber(v)}h`} />
        </SectionCard>
        <SectionCard title={tx('Leitura da Íris')}>
          <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {tx('A diretoria')} <strong>{tx(metrics.overtimeByArea[0]?.area)}</strong> {tx('concentra o maior custo de horas extras do período, respondendo por')}{' '}
            {formatCurrency(metrics.overtimeByArea[0]?.cost ?? 0, { compact: true })} {tx('nos últimos 24 meses. O tipo mais representativo é')}{' '}
            <strong>{tx(byType[0]?.label)}</strong> ({formatPercent(byType[0]?.pct ?? 0)} {tx('do total).')}{' '}
            {tx('Recomenda-se avaliar redistribuição de carga e a política de sobreaviso para reduzir sobrecarga e burnout.')}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
