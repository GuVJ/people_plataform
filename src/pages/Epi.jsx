import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import Table from '../components/ui/Table.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent, formatCurrency } from '../utils/format.js';

export default function Epi() {
  const { hr } = useData();
  const e = hr.epi;
  const k = e.kpis;
  const exportRows = e.consumo.map((c) => ({ EPI: c.label, Consumo: c.value, Custo: c.cost.toFixed(2) }));

  const estoqueCols = [
    { key: 'label', label: 'EPI' },
    { key: 'atual', label: 'Estoque atual', align: 'right', render: (r) => formatNumber(r.atual) },
    { key: 'min', label: 'Mínimo', align: 'right', render: (r) => formatNumber(r.min) },
    { key: 'status', label: 'Status', align: 'right', render: (r) => (r.ruptura ? '⚠ Ruptura' : 'Ok') },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Gestão de EPI</h1>
          <p className="page-subtitle">Consumo, custo, estoque e validade de certificados (CA)</p>
        </div>
        <ExportButton filename="epi_consumo" sheetName="EPI" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Entregas no mês">
          <div className="stat-big">{formatNumber(k.entregasMes)}</div>
        </SectionCard>
        <SectionCard title="Custo no mês">
          <div className="stat-big">{formatCurrency(k.custoMes, { compact: true })}</div>
        </SectionCard>
        <SectionCard title="Conformidade de uso">
          <div className="stat-big">{formatPercent(k.conformidade)}</div>
        </SectionCard>
        <SectionCard title="Rupturas de estoque">
          <div className="stat-big" style={{ color: k.rupturas > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatNumber(k.rupturas)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{formatNumber(k.caVencendo90)} CAs vencendo (90d)</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Consumo por tipo de EPI" subtitle="No mês">
          <BarChart data={e.consumo} valueKey="value" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Custo mensal de EPI" subtitle="Últimos 12 meses">
          <LineChart history={e.custoSeries} formatValue={(v) => formatCurrency(v, { compact: true })} />
        </SectionCard>
      </div>

      <SectionCard title="Estoque vs. mínimo" subtitle="Itens em ruptura destacados">
        <Table columns={estoqueCols} rows={e.estoque} />
      </SectionCard>
    </div>
  );
}
