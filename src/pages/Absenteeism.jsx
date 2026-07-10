import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Absenteeism() {
  const { metrics } = useData();
  const series = metrics.absenteeismSeries;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const last12Days = series.slice(-12).reduce((s, a) => s + a.totalDays, 0);
  const history = series.slice(-12).map((s) => ({ label: s.label, y: s.rate }));

  const exportRows = metrics.absenteeismByManager.map((m) => ({ Gestor: m.manager, 'Dias perdidos': m.days }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Absenteísmo</h1>
          <p className="page-subtitle">Índice de faltas, motivos e comparação por gestor e unidade</p>
        </div>
        <ExportButton filename="absenteismo_por_gestor" sheetName="Absenteísmo" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Índice de absenteísmo (mês)">
          <div className="stat-big">{formatPercent(last.rate)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {last.rate >= prev.rate ? '↑' : '↓'} {formatNumber(Math.abs(last.rate - prev.rate), 2)} p.p. vs. mês anterior
          </p>
        </SectionCard>
        <SectionCard title="Dias perdidos (mês)">
          <div className="stat-big">{formatNumber(last.totalDays)}</div>
        </SectionCard>
        <SectionCard title="Dias perdidos (12 meses)">
          <div className="stat-big">{formatNumber(last12Days)}</div>
        </SectionCard>
        <SectionCard title="Benchmark de mercado">
          <div className="stat-big">{formatPercent(metrics.benchmark.absenteeismRate)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {last.rate > metrics.benchmark.absenteeismRate ? 'Acima do setor' : 'Dentro do esperado para o setor'}
          </p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Tendência de absenteísmo" subtitle="Últimos 12 meses">
          <LineChart history={history} />
        </SectionCard>
        <SectionCard title="Motivos de ausência" subtitle="Últimos 24 meses">
          <BarChart data={metrics.absenteeismByReason} valueKey="days" labelKey="reason" color="var(--chart-5)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Comparação por gestor" subtitle="Dias perdidos — top 8">
          <BarChart data={metrics.absenteeismByManager} valueKey="days" labelKey="manager" color="var(--color-navy)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Comparação por unidade">
          <BarChart data={metrics.absenteeismByUnit} valueKey="days" labelKey="unit" color="var(--chart-3)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
