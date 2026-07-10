import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent, formatCurrency } from '../utils/format.js';

const SERIES = [
  { key: 'voluntary', label: 'Voluntário', color: 'var(--chart-1)' },
  { key: 'involuntary', label: 'Involuntário', color: 'var(--chart-2)' },
];

export default function Turnover() {
  const { metrics } = useData();
  const last12 = metrics.terminationsSeries.slice(-12);
  const chartData = last12.map((t) => ({ label: t.label, total: t.total, values: { voluntary: t.voluntary, involuntary: t.involuntary } }));
  const lastTurnover = metrics.turnoverSeries[metrics.turnoverSeries.length - 1];
  const last12Cost = last12.reduce((s, t) => s + t.cost, 0);

  const exportRows = metrics.turnoverByArea.map((a) => ({
    Área: a.area, Desligamentos: a.count, 'Taxa (%)': a.rate.toFixed(2), 'Custo estimado': a.cost.toFixed(2),
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Turnover</h1>
          <p className="page-subtitle">Rotatividade voluntária e involuntária, motivos e impacto financeiro</p>
        </div>
        <ExportButton filename="turnover_por_area" sheetName="Turnover" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Turnover total (mês)">
          <div className="stat-big">{formatPercent(lastTurnover.totalRate)}</div>
        </SectionCard>
        <SectionCard title="Voluntário">
          <div className="stat-big">{formatPercent(lastTurnover.voluntaryRate)}</div>
        </SectionCard>
        <SectionCard title="Involuntário">
          <div className="stat-big">{formatPercent(lastTurnover.involuntaryRate)}</div>
        </SectionCard>
        <SectionCard title="Custo do turnover (12m)">
          <div className="stat-big">{formatCurrency(last12Cost, { compact: true })}</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Desligamentos por mês" subtitle="Voluntário vs. involuntário — últimos 12 meses">
          <StackedBarChart data={chartData} series={SERIES} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Motivos de desligamento" subtitle="Últimos 12 meses">
          <BarChart data={metrics.terminationReasons} valueKey="count" labelKey="reason" color="var(--chart-5)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Turnover por área" subtitle="Taxa nos últimos 12 meses">
          <BarChart data={metrics.turnoverByArea} valueKey="rate" labelKey="area" formatValue={(v) => formatPercent(v)} />
        </SectionCard>
        <SectionCard title="Comparativo histórico" subtitle="Taxa média mensal">
          <BarChart
            data={metrics.turnoverHistoryYoY.map((h) => ({ label: h.period, value: h.rate }))}
            valueKey="value" labelKey="label" color="var(--color-navy)" formatValue={(v) => formatPercent(v)}
          />
          <p className="text-secondary" style={{ fontSize: 12, marginTop: 12 }}>
            {metrics.turnoverHistoryYoY[1].rate > metrics.turnoverHistoryYoY[0].rate
              ? 'A taxa de turnover dos últimos 12 meses está acima da média do período anterior — recomenda-se investigar as áreas com maior contribuição.'
              : 'A taxa de turnover dos últimos 12 meses está estável ou abaixo da média do período anterior.'}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
