import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Tickets() {
  const { hr } = useData();
  const { tx } = useLang();
  const t = hr.tickets;
  const k = t.kpis;
  const exportRows = t.byCategory.map((c) => ({ Categoria: c.label, Chamados: c.value }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Chamados de RH')}</h1>
          <p className="page-subtitle">{tx('Central de atendimento: volume, SLA, categorias e backlog')}</p>
        </div>
        <ExportButton filename="chamados_rh" sheetName="Chamados" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Abertos no mês')}>
          <div className="stat-big">{formatNumber(k.abertosMes)}</div>
        </SectionCard>
        <SectionCard title={tx('Resolvidos no mês')}>
          <div className="stat-big">{formatNumber(k.resolvidosMes)}</div>
        </SectionCard>
        <SectionCard title={tx('SLA de atendimento')}>
          <div className="stat-big">{formatPercent(k.sla)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Dentro do prazo')}</p>
        </SectionCard>
        <SectionCard title={tx('Backlog')}>
          <div className="stat-big">{formatNumber(k.backlog)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Tempo médio')} {formatNumber(k.tempoMedio, 1)} {tx('dias')}</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Abertos vs. resolvidos')} subtitle={tx('Últimos 12 meses')}>
          <StackedBarChart data={t.series} series={t.seriesKeys} height={240} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Chamados por categoria')} subtitle={tx('No mês')}>
          <BarChart data={t.byCategory} valueKey="value" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title={tx('SLA por categoria')} subtitle={tx('% no prazo')}>
          <BarChart data={t.slaByCategory} valueKey="value" labelKey="label" formatValue={(v) => `${formatNumber(v)}%`} />
        </SectionCard>
      </div>
    </div>
  );
}
