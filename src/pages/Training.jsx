import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import DashboardFilters from '../components/ui/DashboardFilters.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { formatNumber, formatPercent, formatCurrency } from '../utils/format.js';
import './Training.css';

function ProgressRow({ label, value, target, formatValue = (v) => formatPercent(v) }) {
  const { tx } = useLang();
  return (
    <div className="progress-row">
      <div className="progress-row-top">
        <span>{label}</span>
        <span className="progress-row-value">{formatValue(value)}</span>
      </div>
      <div className="progress-row-track">
        <div className="progress-row-fill" style={{ width: `${Math.min(100, value)}%` }} />
        {target !== undefined && <div className="progress-row-target" style={{ left: `${Math.min(100, target)}%` }} title={`${tx('Meta:')} ${formatValue(target)}`} />}
      </div>
    </div>
  );
}

export default function Training() {
  const { tx } = useLang();
  const { metrics } = useDashboardData();
  const { training, benchmark } = metrics;

  const exportRows = training.topTrainings.map((t) => ({ Treinamento: t.name, Participantes: t.count }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Treinamentos')}</h1>
          <p className="page-subtitle">{tx('Horas treinadas, participação, conclusão e retorno sobre investimento')}</p>
        </div>
        <ExportButton filename="treinamentos_participacao" sheetName="Treinamentos" rows={exportRows} />
      </div>

      <DashboardFilters />

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Horas treinadas (ano)')}>
          <div className="stat-big">{formatNumber(training.hoursTotal)}h</div>
        </SectionCard>
        <SectionCard title={tx('Horas por colaborador')}>
          <div className="stat-big">{formatNumber(training.hoursPerEmployee, 1)}h</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('benchmark de mercado:')} {formatNumber(benchmark.trainingHoursPerEmployee)}h</p>
        </SectionCard>
        <SectionCard title={tx('Investimento estimado')}>
          <div className="stat-big">{formatCurrency(training.trainingInvestment, { compact: true })}</div>
        </SectionCard>
        <SectionCard title={tx('ROI estimado')}>
          <div className="stat-big">R$ {formatNumber(training.roiRatio, 2)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('retorno para cada R$ 1,00 investido')}</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Participação e conclusão')}>
          <ProgressRow label={tx('Participação em treinamentos')} value={training.participationPct} target={90} />
          <ProgressRow label={tx('Conclusão média')} value={training.completionPct} target={85} />
          <p className="text-secondary" style={{ fontSize: 12, marginTop: 8 }}>{tx('Marcadores tracejados indicam a meta definida pelo RH.')}</p>
        </SectionCard>
        <SectionCard title={tx('Treinamentos mais concluídos')}>
          <BarChart data={training.topTrainings} valueKey="count" labelKey="name" color="var(--chart-4)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
