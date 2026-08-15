import { useData } from '../context/DataContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Pcd() {
  const { hr } = useData();
  const { tx } = useLang();
  const p = hr.pcd;
  const k = p.kpis;
  const exportRows = p.byArea.map((a) => ({ Diretoria: a.area, PCD: a.count, '%': a.pct.toFixed(1) }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('PCD · Cota legal')}</h1>
          <p className="page-subtitle">{tx('Pessoas com deficiência, cota da Lei 8.213/91 e distribuição')}</p>
        </div>
        <ExportButton filename="pcd_por_diretoria" sheetName="PCD" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('PCD no quadro')}>
          <div className="stat-big">{formatNumber(k.current)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{formatPercent(k.currentPct)} {tx('do total')}</p>
        </SectionCard>
        <SectionCard title={tx('Cota exigida')}>
          <div className="stat-big">{formatNumber(k.required)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{k.quotaPct}{tx('% por faixa de headcount')}</p>
        </SectionCard>
        <SectionCard title={tx('Gap da cota')}>
          <div className="stat-big" style={{ color: k.gap > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatNumber(k.gap)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{k.gap > 0 ? tx('vagas a preencher') : tx('cota cumprida')}</p>
        </SectionCard>
        <SectionCard title={tx('Cumprimento da cota')}>
          <div className="stat-big">{formatPercent(k.cumprimento)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Atual sobre exigido')}</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Por tipo de deficiência')}>
          <DonutChart data={p.typeData} centerValue={formatNumber(k.current)} centerLabel={tx('PCD')} formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
        <SectionCard title={tx('PCD por diretoria')} subtitle={tx('Quantidade no quadro')}>
          <BarChart data={p.byArea} valueKey="count" labelKey="area" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
