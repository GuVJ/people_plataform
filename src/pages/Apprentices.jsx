import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Apprentices() {
  const { hr } = useData();
  const a = hr.apprentices;
  const k = a.kpis;
  const exportRows = a.byArea.map((r) => ({ Diretoria: r.area, Aprendizes: r.count }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Jovem Aprendiz · Cota</h1>
          <p className="page-subtitle">Cota da Lei 10.097/2000, contratações e vencimentos de contrato</p>
        </div>
        <ExportButton filename="jovem_aprendiz" sheetName="Aprendizes" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Aprendizes ativos">
          <div className="stat-big">{formatNumber(k.current)}</div>
        </SectionCard>
        <SectionCard title="Cota mínima">
          <div className="stat-big">{formatNumber(k.required)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>5% dos postos base</p>
        </SectionCard>
        <SectionCard title="Gap da cota">
          <div className="stat-big" style={{ color: k.gap > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatNumber(k.gap)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{k.gap > 0 ? 'contratações pendentes' : 'cota cumprida'}</p>
        </SectionCard>
        <SectionCard title="Contratos vencendo (90d)">
          <div className="stat-big">{formatNumber(k.vencendo90d)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Renovar ou efetivar</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Aprendizes por diretoria">
          <BarChart data={a.byArea} valueKey="count" labelKey="area" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Contratos vencendo por mês" subtitle="Próximos 12 meses">
          <LineChart history={a.expirations} color="var(--chart-5)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <SectionCard title="Admissões de aprendizes" subtitle="Por mês">
        <LineChart history={a.admissions} formatValue={(v) => formatNumber(v)} />
      </SectionCard>
    </div>
  );
}
