import { useData } from '../context/DataContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import HeatmapTable from '../components/ui/HeatmapTable.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import DashboardFilters from '../components/ui/DashboardFilters.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Safety() {
  const { tx } = useLang();
  const { safety } = useDashboardData();
  const k = safety.kpis;

  const incidentSeries = [
    { key: 'lostTime', label: tx('Com afastamento'), color: 'var(--color-danger)' },
    { key: 'noLostTime', label: tx('Sem afastamento'), color: 'var(--chart-3)' },
  ];

  const exportRows = safety.stoppagesByReason.map((r) => ({ Motivo: r.label, Paralisações: r.value }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Segurança do Trabalho')}</h1>
          <p className="page-subtitle">{tx('Inspeções, paralisações, intervenções e indicadores de acidentes (SST)')}</p>
        </div>
        <ExportButton filename="seguranca_paralisacoes" sheetName="Paralisações" rows={exportRows} />
      </div>

      <DashboardFilters />

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Dias sem acidente')}>
          <div className="stat-big">{formatNumber(k.daysWithoutAccident)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Recorde')}: {formatNumber(k.recordDays)} {tx('dias')}</p>
        </SectionCard>
        <SectionCard title={tx('Taxa de frequência (TF)')}>
          <div className="stat-big">{formatNumber(k.tf, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Acidentes c/ afast. por milhão de HHT')}</p>
        </SectionCard>
        <SectionCard title={tx('Taxa de gravidade (TG)')}>
          <div className="stat-big">{formatNumber(k.tg)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Dias perdidos por milhão de HHT')}</p>
        </SectionCard>
        <SectionCard title={tx('TRCF')}>
          <div className="stat-big">{formatNumber(k.trcf, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Casos registráveis (c/ e s/ afast.) por milhão de HHT')}</p>
        </SectionCard>
        <SectionCard title={tx('LTIF')}>
          <div className="stat-big">{formatNumber(k.ltif, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Acidentes com afastamento por milhão de HHT')}</p>
        </SectionCard>
        <SectionCard title={tx('Conformidade das inspeções')}>
          <div className="stat-big">{formatPercent(k.conformidade)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Itens conformes no último mês')}</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Inspeções no mês')}>
          <div className="stat-big">{formatNumber(k.inspecoesMes)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {k.inspecoesMesDelta >= 0 ? '↑' : '↓'} {formatNumber(Math.abs(k.inspecoesMesDelta))} {tx('vs. mês anterior')}
          </p>
        </SectionCard>
        <SectionCard title={tx('Paralisações (12 meses)')}>
          <div className="stat-big">{formatNumber(k.paralisacoes12)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Interdições por risco iminente')}</p>
        </SectionCard>
        <SectionCard title={tx('Acidentes c/ afastamento')}>
          <div className="stat-big">{formatNumber(k.acidentesComAfast12)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Últimos 12 meses')} ({formatNumber(k.acidentesSemAfast12)} {tx('sem afast.')})</p>
        </SectionCard>
        <SectionCard title={tx('Dias perdidos (12 meses)')}>
          <div className="stat-big">{formatNumber(k.diasPerdidos12)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('Por acidentes com afastamento')}</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Acidentes mês a mês')} subtitle={tx('Com e sem afastamento — últimos 12 meses')}>
          <StackedBarChart data={safety.incidentSeries} series={incidentSeries} height={240} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Inspeções realizadas')} subtitle={tx('Volume mensal')}>
          <LineChart history={safety.inspectionSeries.map((s) => ({ label: s.label, y: s.y }))} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Índice de conformidade')} subtitle={tx('% de itens conformes por mês')}>
          <LineChart history={safety.conformitySeries.map((s) => ({ label: s.label, y: s.y }))} color="var(--chart-4)" formatValue={(v) => `${formatNumber(v, 0)}%`} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Motivos das paralisações')} subtitle={tx('Matriz mês a mês (12 meses)')}>
          <HeatmapTable rows={safety.stoppagesByReasonMonthly.rows} cols={safety.stoppagesByReasonMonthly.cols} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title={tx('Intervenções preventivas')} subtitle={tx('Ações de SST no período')}>
          <BarChart data={safety.interventions} valueKey="value" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <SectionCard title={tx('Concentração por diretoria')} subtitle={tx('Acidentes e paralisações por diretoria (12 meses)')}>
        <HeatmapTable rows={safety.heatmap.rows} cols={safety.heatmap.cols} formatValue={(v) => formatNumber(v)} />
      </SectionCard>
    </div>
  );
}
