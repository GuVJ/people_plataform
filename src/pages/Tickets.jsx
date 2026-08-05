import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Tickets() {
  const { hr } = useData();
  const t = hr.tickets;
  const k = t.kpis;
  const exportRows = t.byCategory.map((c) => ({ Categoria: c.label, Chamados: c.value }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Chamados de RH</h1>
          <p className="page-subtitle">Central de atendimento: volume, SLA, categorias e backlog</p>
        </div>
        <ExportButton filename="chamados_rh" sheetName="Chamados" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Abertos no mês">
          <div className="stat-big">{formatNumber(k.abertosMes)}</div>
        </SectionCard>
        <SectionCard title="Resolvidos no mês">
          <div className="stat-big">{formatNumber(k.resolvidosMes)}</div>
        </SectionCard>
        <SectionCard title="SLA de atendimento">
          <div className="stat-big">{formatPercent(k.sla)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Dentro do prazo</p>
        </SectionCard>
        <SectionCard title="Backlog">
          <div className="stat-big">{formatNumber(k.backlog)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Tempo médio {formatNumber(k.tempoMedio, 1)} dias</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title="Abertos vs. resolvidos" subtitle="Últimos 12 meses">
          <StackedBarChart data={t.series} series={t.seriesKeys} height={240} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Chamados por categoria" subtitle="No mês">
          <BarChart data={t.byCategory} valueKey="value" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="SLA por categoria" subtitle="% no prazo">
          <BarChart data={t.slaByCategory} valueKey="value" labelKey="label" formatValue={(v) => `${formatNumber(v)}%`} />
        </SectionCard>
      </div>
    </div>
  );
}
