import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Nrs() {
  const { hr } = useData();
  const n = hr.nrs;
  const k = n.kpis;
  const exportRows = n.cobertura.map((c) => ({ NR: c.label, 'Cobertura (%)': c.value }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Treinamentos de NRs</h1>
          <p className="page-subtitle">Cobertura por Norma Regulamentadora, reciclagens e vencimentos</p>
        </div>
        <ExportButton filename="treinamentos_nrs" sheetName="NRs" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Cobertura média">
          <div className="stat-big">{formatPercent(k.coberturaMedia)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Da força exposta a risco</p>
        </SectionCard>
        <SectionCard title="Treinados no mês">
          <div className="stat-big">{formatNumber(k.treinadosMes)}</div>
        </SectionCard>
        <SectionCard title="Treinamentos vencidos">
          <div className="stat-big" style={{ color: 'var(--color-danger)' }}>{formatNumber(k.vencidos)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Reciclagem em atraso</p>
        </SectionCard>
        <SectionCard title="Vencendo (60 dias)">
          <div className="stat-big">{formatNumber(k.vencendo60d)}</div>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title="Cobertura por NR" subtitle="% da força exposta treinada e em dia">
          <BarChart data={n.cobertura} valueKey="value" labelKey="label" formatValue={(v) => `${formatNumber(v)}%`} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Treinamentos realizados" subtitle="Por mês">
          <LineChart history={n.treinadosMes} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Reciclagens vencendo" subtitle="Por mês">
          <LineChart history={n.vencimentos} color="var(--chart-5)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
