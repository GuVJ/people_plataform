import { useData } from '../context/DataContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import HeatmapTable from '../components/ui/HeatmapTable.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import Table from '../components/ui/Table.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import DashboardFilters from '../components/ui/DashboardFilters.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { CID_GROUPS } from '../data/medicalLeave.js';
import { formatNumber, formatPercent } from '../utils/format.js';
import './MedicalLeave.css';

export default function MedicalLeave() {
  const { tx } = useLang();
  const { medical } = useDashboardData();
  const k = medical.kpis;

  const stackSeries = CID_GROUPS.map((g) => ({ key: g.key, label: g.label, color: g.color }));
  const donutData = medical.groups.slice(0, 8).map((g) => ({ label: g.label, count: g.count, pct: g.pct, color: g.color }));
  const mentalTrend = medical.mentalHealthTrend.map((m) => ({ label: m.label, y: m.y }));

  const exportRows = medical.groups.map((g) => ({
    'Grupo CID': g.label, Faixa: g.code, Atestados: g.count, 'Dias perdidos': g.days, 'Duração média (dias)': g.avgDays,
  }));

  const cidColumns = [
    { key: 'code', label: tx('CID') },
    { key: 'label', label: tx('Descrição') },
    { key: 'group', label: tx('Grupo') },
    { key: 'count', label: tx('Atestados'), align: 'right', render: (r) => formatNumber(r.count) },
    { key: 'avgDays', label: tx('Dias médios'), align: 'right', render: (r) => formatNumber(r.avgDays, 1) },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Atestados')}</h1>
          <p className="page-subtitle">{tx('Evolução por grupo de CID-10, concentração por diretoria e saúde mental')}</p>
        </div>
        <ExportButton filename="atestados_por_cid" sheetName="Atestados" rows={exportRows} />
      </div>

      <DashboardFilters />

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Atestados no mês')}>
          <div className="stat-big">{formatNumber(k.atestadosMes)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {k.atestadosMesDelta >= 0 ? '↑' : '↓'} {formatNumber(Math.abs(k.atestadosMesDelta))} {tx('vs. mês anterior')}
          </p>
        </SectionCard>
        <SectionCard title={tx('Dias perdidos no mês')}>
          <div className="stat-big">{formatNumber(k.diasMes)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Duração média')} {formatNumber(k.duracaoMedia, 1)} {tx('dias/atestado')}</p>
        </SectionCard>
        <SectionCard title={tx('Saúde mental (CID F)')}>
          <div className="stat-big">{formatPercent(k.pctMental)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Participação nos atestados (12 meses)')}</p>
        </SectionCard>
        <SectionCard title={tx('Afastamentos > 15 dias')}>
          <div className="stat-big">{formatNumber(k.inss15)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Encaminhados ao INSS (12 meses)')}</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Evolução mês a mês por tipo de CID')} subtitle={tx('Nº de atestados nos últimos 12 meses')}>
          <StackedBarChart data={medical.monthlyByCid} series={stackSeries} height={260} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Mapa de concentração de atestados')} subtitle={tx('Diretoria × grupo de CID (12 meses) — quanto mais escuro, maior a concentração')}>
          <HeatmapTable rows={medical.heatmap.rows} cols={medical.heatmap.cols} formatValue={(v) => formatNumber(v)} />
          <div className="cid-legend">
            {medical.heatmap.cols.map((c) => {
              const g = CID_GROUPS.find((x) => x.key === c.key);
              return (
                <span className="cid-legend-item" key={c.key}>
                  <span className="cid-legend-swatch" style={{ background: g.color }} />
                  <strong>{c.key}</strong> · {tx(g.label)} <span className="text-tertiary">({g.code})</span>
                </span>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Distribuição por grupo de CID')} subtitle={tx('Últimos 12 meses')}>
          <DonutChart data={donutData} centerValue={formatNumber(medical.total12)} centerLabel={tx('atestados')} formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Tendência de saúde mental')} subtitle={tx('Participação % do CID F por mês')}>
          <LineChart history={mentalTrend} color="var(--chart-6)" formatValue={(v) => `${formatNumber(v, 1)}%`} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Duração dos afastamentos')} subtitle={tx('Distribuição por faixa de dias')}>
          <BarChart data={medical.durationBuckets} valueKey="count" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title={tx('CIDs mais frequentes')} subtitle={tx('Top diagnósticos (12 meses)')}>
          <Table columns={cidColumns} rows={medical.topCids} />
        </SectionCard>
      </div>
    </div>
  );
}
