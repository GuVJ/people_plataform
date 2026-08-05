import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function SalaryPositioning() {
  const { hr } = useData();
  const p = hr.positioning;
  const k = p.kpis;
  const compa = (v) => formatNumber(v, 2);
  const exportRows = p.byArea.map((a) => ({ Diretoria: a.area, 'Compa-ratio': a.compa.toFixed(2) }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Posicionamento Salarial</h1>
          <p className="page-subtitle">Compa-ratio: salário frente à mediana da faixa por cargo e diretoria</p>
        </div>
        <ExportButton filename="posicionamento_salarial" sheetName="Posicionamento" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Compa-ratio médio">
          <div className="stat-big">{compa(k.compaMedio)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>1,00 = na mediana da faixa</p>
        </SectionCard>
        <SectionCard title="Dentro da faixa">
          <div className="stat-big">{formatPercent(k.pctDentro)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Entre 0,90 e 1,10</p>
        </SectionCard>
        <SectionCard title="Abaixo do piso">
          <div className="stat-big">{formatPercent(k.pctAbaixo)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Compa-ratio &lt; 0,90</p>
        </SectionCard>
        <SectionCard title="Acima do teto">
          <div className="stat-big">{formatPercent(k.pctAcima)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Compa-ratio &gt; 1,10</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Distribuição do posicionamento" subtitle="Frente à faixa salarial">
          <DonutChart data={p.dist} centerValue={compa(k.compaMedio)} centerLabel="compa médio" formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
        <SectionCard title="Compa-ratio por diretoria">
          <BarChart data={p.byArea} valueKey="compa" labelKey="area" formatValue={compa} />
        </SectionCard>
      </div>

      <SectionCard title="Compa-ratio por cargo" subtitle="Do júnior ao C-level">
        <BarChart data={p.byRole} valueKey="compa" labelKey="role" formatValue={compa} />
      </SectionCard>
    </div>
  );
}
