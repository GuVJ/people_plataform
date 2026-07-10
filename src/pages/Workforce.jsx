import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatCurrency } from '../utils/format.js';

export default function Workforce() {
  const { metrics } = useData();
  const history = metrics.headcountSeries.slice(-12).map((s) => ({ month: s.month, label: s.label, y: s.total }));

  const exportRows = metrics.activeNow.map((e) => ({
    Nome: e.name, Área: e.area, Cargo: e.roleLevel, Unidade: e.unit,
    Salário: e.salary, Admissão: e.admissionDate.toLocaleDateString('pt-BR'), Gestor: e.managerName,
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Workforce</h1>
          <p className="page-subtitle">Headcount, estrutura organizacional e distribuição de força de trabalho</p>
        </div>
        <ExportButton filename="workforce_colaboradores" sheetName="Colaboradores" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Headcount ativo" className="workforce-stat">
          <div className="stat-big">{formatNumber(metrics.activeNow.length)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>colaboradores no quadro atual</p>
        </SectionCard>
        <SectionCard title="Folha de pagamento" className="workforce-stat">
          <div className="stat-big">{formatCurrency(metrics.payrollSeries[metrics.payrollSeries.length - 1].total, { compact: true })}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>custo mensal com salários</p>
        </SectionCard>
        <SectionCard title="Áreas monitoradas" className="workforce-stat">
          <div className="stat-big">{metrics.headcountByArea.length}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>unidades de negócio</p>
        </SectionCard>
        <SectionCard title="Tempo médio de empresa" className="workforce-stat">
          <div className="stat-big">{formatNumber(metrics.tenureSeries[metrics.tenureSeries.length - 1].years, 1)} anos</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>antiguidade média do quadro ativo</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Evolução de headcount" subtitle="Últimos 12 meses" span={1}>
          <LineChart history={history} />
        </SectionCard>
        <SectionCard title="Distribuição por área">
          <BarChart data={metrics.headcountByArea} valueKey="count" labelKey="area" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Distribuição por cargo">
          <BarChart data={metrics.headcountByRole} valueKey="count" labelKey="role" color="var(--color-navy)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Faixa salarial" subtitle="Quantidade de colaboradores por faixa">
          <BarChart data={metrics.salaryBands} valueKey="count" labelKey="label" color="var(--chart-3)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
