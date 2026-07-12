import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Recruitment() {
  const { metrics } = useData();
  const { recruitment } = metrics;
  const deltaDays = recruitment.avgTimeToHireDaysCurrent - recruitment.avgTimeToHireDaysPrevious;
  const timeToHireHistory = recruitment.timeToHireSeries.map((s) => ({ label: s.label, y: s.days }));

  const funnelWithConversion = recruitment.funnel.map((f, i, arr) => ({
    ...f,
    conv: i === 0 ? 100 : (f.count / arr[0].count) * 100,
  }));

  const exportRows = recruitment.funnel.map((f) => ({ Etapa: f.stage, Quantidade: f.count }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Recrutamento</h1>
          <p className="page-subtitle">Funil de contratação, tempo para contratar e fontes de candidatos</p>
        </div>
        <ExportButton filename="recrutamento_funil" sheetName="Funil" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Contratações (6 meses)">
          <div className="stat-big">{formatNumber(recruitment.hired)}</div>
        </SectionCard>
        <SectionCard title="Tempo médio de contratação">
          <div className="stat-big">{formatNumber(recruitment.avgTimeToHireDaysCurrent, 0)} dias</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {deltaDays <= 0 ? '↓' : '↑'} {formatNumber(Math.abs(deltaDays), 1)} dias vs. período anterior
          </p>
        </SectionCard>
        <SectionCard title="SLA de contratação">
          <div className="stat-big">{formatPercent(recruitment.slaPct)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>dentro da meta de {recruitment.slaTargetDays} dias</p>
        </SectionCard>
        <SectionCard title="Conversão candidato → contratado">
          <div className="stat-big">{formatPercent((recruitment.funnel.at(-1).count / recruitment.funnel[0].count) * 100)}</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Funil de recrutamento" subtitle="Conversão acumulada por etapa">
          <BarChart
            data={funnelWithConversion}
            valueKey="count" labelKey="stage" color="var(--chart-1)"
            formatValue={(v) => formatNumber(v)}
          />
        </SectionCard>
        <SectionCard title="Fontes de candidatos">
          <BarChart data={recruitment.bySource} valueKey="count" labelKey="source" color="var(--chart-3)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Tempo para contratar" subtitle="Evolução mensal (dias)">
          <LineChart history={timeToHireHistory} formatValue={(v) => `${formatNumber(v, 0)}d`} />
        </SectionCard>
        <SectionCard title="SLA por diretoria" subtitle="Tempo médio de contratação (dias)">
          <BarChart data={recruitment.byAreaTimeToHire} valueKey="days" labelKey="area" color="var(--color-navy)" formatValue={(v) => `${formatNumber(v)}d`} />
        </SectionCard>
      </div>
    </div>
  );
}
