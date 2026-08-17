import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import HeatmapTable from '../components/ui/HeatmapTable.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import DashboardFilters from '../components/ui/DashboardFilters.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { formatNumber, formatCurrency } from '../utils/format.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Workforce() {
  const { tx } = useLang();
  const { metrics } = useDashboardData();
  const history = metrics.headcountSeries.slice(-12).map((s) => ({ month: s.month, label: s.label, y: s.total }));

  const exportRows = metrics.activeNow.map((e) => ({
    Nome: e.name, Diretoria: e.area, Cargo: e.roleLevel, Unidade: e.unit,
    Salário: e.salary, Admissão: e.admissionDate.toLocaleDateString('pt-BR'), Gestor: e.managerName,
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Workforce')}</h1>
          <p className="page-subtitle">{tx('Headcount, estrutura organizacional e distribuição de força de trabalho')}</p>
        </div>
        <ExportButton filename="workforce_colaboradores" sheetName="Colaboradores" rows={exportRows} />
      </div>

      <DashboardFilters />

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Headcount ativo')} className="workforce-stat">
          <div className="stat-big">{formatNumber(metrics.activeNow.length)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('colaboradores no quadro atual')}</p>
        </SectionCard>
        <SectionCard title={tx('Folha de pagamento')} className="workforce-stat">
          <div className="stat-big">{formatCurrency(metrics.payrollSeries[metrics.payrollSeries.length - 1].total, { compact: true })}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('custo mensal com salários')}</p>
        </SectionCard>
        <SectionCard title={tx('Diretorias monitoradas')} className="workforce-stat">
          <div className="stat-big">{metrics.headcountByArea.length}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('unidades de negócio')}</p>
        </SectionCard>
        <SectionCard title={tx('Tempo médio de empresa')} className="workforce-stat">
          <div className="stat-big">{formatNumber(metrics.tenureSeries[metrics.tenureSeries.length - 1].years, 1)} {tx('anos')}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('antiguidade média do quadro ativo')}</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Evolução de headcount')} subtitle={tx('Últimos 12 meses')}>
          <LineChart history={history} formatValue={(v) => formatNumber(v, 0)} showAllLabels />
        </SectionCard>
      </div>
      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Headcount por diretoria')} subtitle={tx('Matriz mês a mês (12 meses)')}>
          <HeatmapTable rows={metrics.headcountByAreaMonthly.rows} cols={metrics.headcountByAreaMonthly.cols} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Distribuição por cargo')}>
          <BarChart data={metrics.headcountByRole} valueKey="count" labelKey="role" color="var(--color-navy)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title={tx('Faixa salarial')} subtitle={tx('Quantidade de colaboradores por faixa')}>
          <BarChart data={metrics.salaryBands} valueKey="count" labelKey="label" color="var(--chart-3)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
