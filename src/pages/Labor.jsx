import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatCurrency } from '../utils/format.js';

export default function Labor() {
  const { hr } = useData();
  const l = hr.labor;
  const k = l.kpis;
  const exportRows = l.byReason.map((r) => ({ Motivo: r.reason, Processos: r.count }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Trabalhista</h1>
          <p className="page-subtitle">Reclamatórias, provisão, motivos e status dos processos</p>
        </div>
        <ExportButton filename="trabalhista_processos" sheetName="Trabalhista" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Processos ativos">
          <div className="stat-big">{formatNumber(k.ativos)}</div>
        </SectionCard>
        <SectionCard title="Provisão total">
          <div className="stat-big">{formatCurrency(k.provisao, { compact: true })}</div>
        </SectionCard>
        <SectionCard title="Ticket médio">
          <div className="stat-big">{formatCurrency(k.ticket, { compact: true })}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Por processo</p>
        </SectionCard>
        <SectionCard title="Índice de litigância">
          <div className="stat-big">{formatNumber(k.indice, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Processos por mil colaboradores</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Evolução da provisão" subtitle="Últimos 12 meses">
          <LineChart history={l.provisionSeries} color="var(--chart-7)" formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
        <SectionCard title="Novas vs. encerradas" subtitle="Por mês">
          <StackedBarChart data={l.flow} series={l.flowKeys} height={200} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Por motivo">
          <BarChart data={l.byReason} valueKey="count" labelKey="reason" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Por status">
          <DonutChart data={l.byStatus} centerValue={formatNumber(k.ativos)} centerLabel="processos" formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
      </div>
    </div>
  );
}
