import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import Table from '../components/ui/Table.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';
import { average } from '../utils/stats.js';

export default function Benchmark() {
  const { metrics } = useData();
  const { benchmark } = metrics;

  const companyTurnoverMonthly = metrics.turnoverSeries.at(-1).totalRate;
  const companyTurnoverAnnual = average(metrics.turnoverSeries.slice(-12), (t) => t.totalRate) * 12;
  const companyAbsenteeism = metrics.absenteeismSeries.at(-1).rate;
  const companyTimeToHire = metrics.recruitment.avgTimeToHireDaysCurrent;
  const companyOvertimePct = (metrics.overtimeSeries.at(-1).cost / (metrics.payrollSeries.at(-1).total || 1)) * 100;
  const companyEngagement = average(metrics.activeNow, (e) => e.engagementScore);
  const companyTrainingHours = metrics.training.hoursPerEmployee;

  const rows = [
    { indicator: 'Turnover mensal', company: companyTurnoverMonthly, market: benchmark.turnoverMonthly, unit: '%', lowerIsBetter: true },
    { indicator: 'Turnover anualizado', company: companyTurnoverAnnual, market: benchmark.turnoverAnnual, unit: '%', lowerIsBetter: true },
    { indicator: 'Absenteísmo', company: companyAbsenteeism, market: benchmark.absenteeismRate, unit: '%', lowerIsBetter: true },
    { indicator: 'Tempo médio de contratação', company: companyTimeToHire, market: benchmark.timeToHireDays, unit: ' dias', lowerIsBetter: true },
    { indicator: 'Custo de horas extras (% folha)', company: companyOvertimePct, market: benchmark.overtimeCostPctPayroll, unit: '%', lowerIsBetter: true },
    { indicator: 'Engajamento', company: companyEngagement, market: benchmark.engagementScore, unit: '', lowerIsBetter: false },
    { indicator: 'Horas de treinamento / colaborador', company: companyTrainingHours, market: benchmark.trainingHoursPerEmployee, unit: 'h', lowerIsBetter: false },
  ].map((r) => ({
    ...r,
    diff: r.company - r.market,
    isGood: r.lowerIsBetter ? r.company <= r.market : r.company >= r.market,
  }));

  const exportRows = rows.map((r) => ({
    Indicador: r.indicator, Empresa: r.company.toFixed(1), Mercado: r.market.toFixed(1), Diferença: r.diff.toFixed(1),
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Benchmark de mercado</h1>
          <p className="page-subtitle">Como os indicadores da empresa se comparam ao setor</p>
        </div>
        <ExportButton filename="benchmark_mercado" sheetName="Benchmark" rows={exportRows} />
      </div>

      <SectionCard title="Comparativo de indicadores">
        <Table
          columns={[
            { key: 'indicator', label: 'Indicador' },
            { key: 'company', label: 'Empresa', align: 'right', render: (r) => `${formatNumber(r.company, 1)}${r.unit}` },
            { key: 'market', label: 'Mercado', align: 'right', render: (r) => `${formatNumber(r.market, 1)}${r.unit}` },
            {
              key: 'diff', label: 'Diferença', align: 'right', render: (r) => (
                <span className={r.isGood ? 'value-good' : 'value-bad'}>
                  {r.diff >= 0 ? '+' : ''}{formatNumber(r.diff, 1)}{r.unit}
                </span>
              ),
            },
            {
              key: 'status', label: 'Status', render: (r) => (
                <span className={`badge ${r.isGood ? 'badge-success' : 'badge-warning'}`}>{r.isGood ? 'Favorável' : 'Atenção'}</span>
              ),
            },
          ]}
          rows={rows}
          rowKey={(r) => r.indicator}
        />
      </SectionCard>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="Leitura do Copiloto">
          <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            A empresa está {rows.filter((r) => r.isGood).length} de {rows.length} indicadores em posição favorável frente ao benchmark setorial.
            {' '}Os pontos de maior atenção são: {rows.filter((r) => !r.isGood).map((r) => r.indicator).join(', ') || 'nenhum no momento'}.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
