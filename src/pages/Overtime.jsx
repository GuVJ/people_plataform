import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatCurrency, formatPercent } from '../utils/format.js';

export default function Overtime() {
  const { metrics } = useData();
  const series = metrics.overtimeSeries;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const payroll = metrics.payrollSeries[metrics.payrollSeries.length - 1].total;
  const pctOfPayroll = (last.cost / (payroll || 1)) * 100;
  const history = series.slice(-12).map((s) => ({ label: s.label, y: s.cost }));

  const exportRows = metrics.overtimeByArea.map((a) => ({ Área: a.area, 'Custo estimado': a.cost.toFixed(2) }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Horas Extras</h1>
          <p className="page-subtitle">Evolução, custo e ranking por área e gestor</p>
        </div>
        <ExportButton filename="horas_extras_por_area" sheetName="Horas Extras" rows={exportRows} />
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
          <div className="stat-big">{formatCurrency(series.slice(-12).reduce((s, o) => s + o.cost, 0), { compact: true })}</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Evolução do custo de horas extras" subtitle="Últimos 12 meses">
          <LineChart history={history} formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
        <SectionCard title="Ranking de áreas" subtitle="Custo acumulado (24 meses)">
          <BarChart data={metrics.overtimeByArea} valueKey="cost" labelKey="area" formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Ranking de gestores" subtitle="Horas acumuladas do time (24 meses) — top 8">
          <BarChart data={metrics.overtimeByManager} valueKey="hours" labelKey="manager" color="var(--color-navy)" formatValue={(v) => `${formatNumber(v)}h`} />
        </SectionCard>
        <SectionCard title="Leitura do Copiloto">
          <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            A área <strong>{metrics.overtimeByArea[0]?.area}</strong> concentra o maior custo de horas extras do período,
            respondendo por {formatCurrency(metrics.overtimeByArea[0]?.cost ?? 0, { compact: true })} nos últimos 24 meses.
            Recomenda-se avaliar redistribuição de carga de trabalho ou reforço de headcount nessa área para reduzir o risco de sobrecarga e burnout.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
