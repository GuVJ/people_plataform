import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatCurrency } from '../utils/format.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Labor() {
  const { hr } = useData();
  const { tx } = useLang();
  const l = hr.labor;
  const k = l.kpis;
  const exportRows = l.byReason.map((r) => ({ Motivo: r.reason, Processos: r.count }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Trabalhista')}</h1>
          <p className="page-subtitle">{tx('Reclamatórias, provisão, motivos e status dos processos')}</p>
        </div>
        <ExportButton filename="trabalhista_processos" sheetName="Trabalhista" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Processos ativos')}>
          <div className="stat-big">{formatNumber(k.ativos)}</div>
        </SectionCard>
        <SectionCard title={tx('Provisão total')}>
          <div className="stat-big">{formatCurrency(k.provisao, { compact: true })}</div>
        </SectionCard>
        <SectionCard title={tx('Ticket médio')}>
          <div className="stat-big">{formatCurrency(k.ticket, { compact: true })}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Por processo')}</p>
        </SectionCard>
        <SectionCard title={tx('Índice de litigância')}>
          <div className="stat-big">{formatNumber(k.indice, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Processos por mil colaboradores')}</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Evolução da provisão')} subtitle={tx('Últimos 12 meses')}>
          <LineChart history={l.provisionSeries} color="var(--chart-7)" formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
      </div>
      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Novas vs. encerradas')} subtitle={tx('Por mês')}>
          <StackedBarChart data={l.flow} series={l.flowKeys} height={200} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Por motivo')}>
          <BarChart data={l.byReason} valueKey="count" labelKey="reason" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title={tx('Por status')}>
          <DonutChart data={l.byStatus} centerValue={formatNumber(k.ativos)} centerLabel={tx('processos')} formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
      </div>
    </div>
  );
}
