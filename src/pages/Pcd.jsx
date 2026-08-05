import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Pcd() {
  const { hr } = useData();
  const p = hr.pcd;
  const k = p.kpis;
  const exportRows = p.byArea.map((a) => ({ Diretoria: a.area, PCD: a.count, '%': a.pct.toFixed(1) }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>PCD · Cota legal</h1>
          <p className="page-subtitle">Pessoas com deficiência, cota da Lei 8.213/91 e distribuição</p>
        </div>
        <ExportButton filename="pcd_por_diretoria" sheetName="PCD" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="PCD no quadro">
          <div className="stat-big">{formatNumber(k.current)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{formatPercent(k.currentPct)} do total</p>
        </SectionCard>
        <SectionCard title="Cota exigida">
          <div className="stat-big">{formatNumber(k.required)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{k.quotaPct}% por faixa de headcount</p>
        </SectionCard>
        <SectionCard title="Gap da cota">
          <div className="stat-big" style={{ color: k.gap > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatNumber(k.gap)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{k.gap > 0 ? 'vagas a preencher' : 'cota cumprida'}</p>
        </SectionCard>
        <SectionCard title="Cumprimento da cota">
          <div className="stat-big">{formatPercent(k.cumprimento)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Atual sobre exigido</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Por tipo de deficiência">
          <DonutChart data={p.typeData} centerValue={formatNumber(k.current)} centerLabel="PCD" formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
        <SectionCard title="PCD por diretoria" subtitle="Quantidade no quadro">
          <BarChart data={p.byArea} valueKey="count" labelKey="area" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
