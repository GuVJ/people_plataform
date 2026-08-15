import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Disciplinary() {
  const { hr } = useData();
  const { tx } = useLang();
  const d = hr.disciplinary;
  const k = d.kpis;
  const exportRows = d.byReason.map((r) => ({ Motivo: r.reason, Ocorrências: r.count }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Medidas Disciplinares')}</h1>
          <p className="page-subtitle">{tx('Advertências, suspensões e justa causa por tipo, motivo e mês')}</p>
        </div>
        <ExportButton filename="medidas_disciplinares" sheetName="Disciplinar" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Total (12 meses)')}>
          <div className="stat-big">{formatNumber(k.total12)}</div>
        </SectionCard>
        <SectionCard title={tx('Taxa por 100 colaboradores')}>
          <div className="stat-big">{formatNumber(k.taxaPor100, 1)}</div>
        </SectionCard>
        <SectionCard title={tx('Suspensões')}>
          <div className="stat-big">{formatNumber(k.suspensoes)}</div>
        </SectionCard>
        <SectionCard title={tx('Reincidência')}>
          <div className="stat-big">{formatPercent(k.reincidencia)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Colaboradores com 2+ medidas')}</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Evolução por tipo')} subtitle={tx('Últimos 12 meses')}>
          <StackedBarChart data={d.monthly} series={d.series} height={240} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Por tipo de medida')}>
          <DonutChart data={d.byType} centerValue={formatNumber(k.total12)} centerLabel={tx('medidas')} formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
        <SectionCard title={tx('Principais motivos')}>
          <BarChart data={d.byReason} valueKey="count" labelKey="reason" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
