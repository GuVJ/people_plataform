import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function SalaryPositioning() {
  const { hr } = useData();
  const { tx } = useLang();
  const p = hr.positioning;
  const k = p.kpis;
  const compa = (v) => formatNumber(v, 2);
  const exportRows = p.byArea.map((a) => ({ Diretoria: a.area, 'Compa-ratio': a.compa.toFixed(2) }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Posicionamento Salarial')}</h1>
          <p className="page-subtitle">{tx('Compa-ratio: salário frente à mediana da faixa por cargo e diretoria')}</p>
        </div>
        <ExportButton filename="posicionamento_salarial" sheetName="Posicionamento" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Compa-ratio médio')}>
          <div className="stat-big">{compa(k.compaMedio)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('1,00 = na mediana da faixa')}</p>
        </SectionCard>
        <SectionCard title={tx('Dentro da faixa')}>
          <div className="stat-big">{formatPercent(k.pctDentro)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Entre 0,90 e 1,10')}</p>
        </SectionCard>
        <SectionCard title={tx('Abaixo do piso')}>
          <div className="stat-big">{formatPercent(k.pctAbaixo)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Compa-ratio < 0,90')}</p>
        </SectionCard>
        <SectionCard title={tx('Acima do teto')}>
          <div className="stat-big">{formatPercent(k.pctAcima)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Compa-ratio > 1,10')}</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Distribuição do posicionamento')} subtitle={tx('Frente à faixa salarial')}>
          <DonutChart data={p.dist} centerValue={compa(k.compaMedio)} centerLabel={tx('compa médio')} formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
        <SectionCard title={tx('Compa-ratio por diretoria')}>
          <BarChart data={p.byArea} valueKey="compa" labelKey="area" formatValue={compa} />
        </SectionCard>
      </div>

      <SectionCard title={tx('Compa-ratio por cargo')} subtitle={tx('Do júnior ao C-level')}>
        <BarChart data={p.byRole} valueKey="compa" labelKey="role" formatValue={compa} />
      </SectionCard>
    </div>
  );
}
