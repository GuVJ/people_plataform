import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import HeatmapTable from '../components/ui/HeatmapTable.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import DashboardFilters from '../components/ui/DashboardFilters.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Absenteeism() {
  const { tx } = useLang();
  const { metrics } = useDashboardData();
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
          <h1>{tx('Absenteísmo')}</h1>
          <p className="page-subtitle">{tx('Índice de faltas, motivos e comparação por gestor e unidade')}</p>
        </div>
        <ExportButton filename="absenteismo_por_gestor" sheetName="Absenteísmo" rows={exportRows} />
      </div>

      <DashboardFilters />

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Índice de absenteísmo (mês)')}>
          <div className="stat-big">{formatPercent(last.rate)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {last.rate >= prev.rate ? '↑' : '↓'} {formatNumber(Math.abs(last.rate - prev.rate), 2)} {tx('p.p. vs. mês anterior')}
          </p>
        </SectionCard>
        <SectionCard title={tx('Dias perdidos (mês)')}>
          <div className="stat-big">{formatNumber(last.totalDays)}</div>
        </SectionCard>
        <SectionCard title={tx('Dias perdidos (12 meses)')}>
          <div className="stat-big">{formatNumber(last12Days)}</div>
        </SectionCard>
        <SectionCard title={tx('Benchmark de mercado')}>
          <div className="stat-big">{formatPercent(metrics.benchmark.absenteeismRate)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {last.rate > metrics.benchmark.absenteeismRate ? tx('Acima do setor') : tx('Dentro do esperado para o setor')}
          </p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Tendência de absenteísmo')} subtitle={tx('Últimos 12 meses')}>
          <LineChart history={history} formatValue={(v) => formatPercent(v)} />
        </SectionCard>
      </div>
      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Motivos de ausência')} subtitle={tx('Dias perdidos, mês a mês (12 meses)')}>
          <HeatmapTable rows={metrics.absenteeismByReasonMonthly.rows} cols={metrics.absenteeismByReasonMonthly.cols} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Comparação por gestor')} subtitle={tx('Dias perdidos — top 8')}>
          <BarChart data={metrics.absenteeismByManager} valueKey="days" labelKey="manager" color="var(--color-navy)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title={tx('Comparação por unidade')}>
          <BarChart data={metrics.absenteeismByUnit} valueKey="days" labelKey="unit" color="var(--chart-3)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
