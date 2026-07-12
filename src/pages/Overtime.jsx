import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { OVERTIME_COST_TYPES } from '../data/constants.js';
import { formatNumber, formatCurrency, formatPercent } from '../utils/format.js';
import './Overtime.css';

export default function Overtime() {
  const { metrics } = useData();
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
          <h1>Horas Extras</h1>
          <p className="page-subtitle">Evolução, composição por tipo e ranking por diretoria e gestor</p>
        </div>
        <ExportButton filename="horas_extras_por_tipo" sheetName="Horas Extras" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Custo de horas extras (mês)">
          <div className="stat-big">{formatCurrency(last.cost, { compact: true })}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {last.cost >= prev.cost ? '↑' : '↓'} {formatCurrency(Math.abs(last.cost - prev.cost), { compact: true })} vs. mês anterior
          </p>
        </SectionCard>
        <SectionCard title="Horas extras (mês)">
          <div className="stat-big">{formatNumber(last.hours)}h</div>
        </SectionCard>
        <SectionCard title="% da folha de pagamento">
          <div className="stat-big">{formatPercent(pctOfPayroll)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>benchmark de mercado: {formatPercent(metrics.benchmark.overtimeCostPctPayroll)}</p>
        </SectionCard>
        <SectionCard title="Custo acumulado (12 meses)">
          <div className="stat-big">{formatCurrency(annualCost, { compact: true })}</div>
        </SectionCard>
      </div>

      <div className="section-title"><span>Composição do custo por tipo de hora extra</span></div>
      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Custo no mês por tipo" subtitle={`Total: ${formatCurrency(last.cost, { compact: true })}`}>
          <BarChart
            data={byType}
            valueKey="monthly" labelKey="label"
            formatValue={(v) => formatCurrency(v, { compact: true })}
          />
        </SectionCard>
        <SectionCard title="O que compõe cada tipo">
          <div className="overtime-type-list">
            {byType.map((t) => (
              <div className="overtime-type-item" key={t.key}>
                <div className="overtime-type-top">
                  <span className="overtime-type-label">{t.label}</span>
                  <span className="overtime-type-value">{formatCurrency(t.monthly, { compact: true })}/mês · {formatPercent(t.pct)}</span>
                </div>
                <p className="overtime-type-desc">{t.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Evolução do custo de horas extras" subtitle="Últimos 12 meses">
          <LineChart history={history} formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
        <SectionCard title="Ranking de diretorias" subtitle="Custo acumulado (24 meses)">
          <BarChart data={metrics.overtimeByArea} valueKey="cost" labelKey="area" formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Ranking de gestores" subtitle="Horas acumuladas do time (24 meses) — top 8">
          <BarChart data={metrics.overtimeByManager} valueKey="hours" labelKey="manager" color="var(--color-navy)" formatValue={(v) => `${formatNumber(v)}h`} />
        </SectionCard>
        <SectionCard title="Leitura do Copiloto">
          <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            A diretoria <strong>{metrics.overtimeByArea[0]?.area}</strong> concentra o maior custo de horas extras do período,
            respondendo por {formatCurrency(metrics.overtimeByArea[0]?.cost ?? 0, { compact: true })} nos últimos 24 meses.
            O tipo mais representativo é <strong>{byType[0]?.label}</strong> ({formatPercent(byType[0]?.pct ?? 0)} do total).
            Recomenda-se avaliar redistribuição de carga e a política de sobreaviso para reduzir sobrecarga e burnout.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
