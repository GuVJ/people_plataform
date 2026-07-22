import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import StackedBarChart from '../components/ui/StackedBarChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import HeatmapTable from '../components/ui/HeatmapTable.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Safety() {
  const { safety } = useData();
  const k = safety.kpis;

  const incidentSeries = [
    { key: 'lostTime', label: 'Com afastamento', color: 'var(--color-danger)' },
    { key: 'noLostTime', label: 'Sem afastamento', color: 'var(--chart-3)' },
  ];

  const exportRows = safety.stoppagesByReason.map((r) => ({ Motivo: r.label, Paralisações: r.value }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Segurança do Trabalho</h1>
          <p className="page-subtitle">Inspeções, paralisações, intervenções e indicadores de acidentes (SST)</p>
        </div>
        <ExportButton filename="seguranca_paralisacoes" sheetName="Paralisações" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Dias sem acidente">
          <div className="stat-big">{formatNumber(k.daysWithoutAccident)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Recorde: {formatNumber(k.recordDays)} dias</p>
        </SectionCard>
        <SectionCard title="Taxa de frequência (TF)">
          <div className="stat-big">{formatNumber(k.tf, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Acidentes c/ afast. por milhão de HHT</p>
        </SectionCard>
        <SectionCard title="Taxa de gravidade (TG)">
          <div className="stat-big">{formatNumber(k.tg)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Dias perdidos por milhão de HHT</p>
        </SectionCard>
        <SectionCard title="Conformidade das inspeções">
          <div className="stat-big">{formatPercent(k.conformidade)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Itens conformes no último mês</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Inspeções no mês">
          <div className="stat-big">{formatNumber(k.inspecoesMes)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>
            {k.inspecoesMesDelta >= 0 ? '↑' : '↓'} {formatNumber(Math.abs(k.inspecoesMesDelta))} vs. mês anterior
          </p>
        </SectionCard>
        <SectionCard title="Paralisações (12 meses)">
          <div className="stat-big">{formatNumber(k.paralisacoes12)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Interdições por risco iminente</p>
        </SectionCard>
        <SectionCard title="Acidentes c/ afastamento">
          <div className="stat-big">{formatNumber(k.acidentesComAfast12)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Últimos 12 meses ({formatNumber(k.acidentesSemAfast12)} sem afast.)</p>
        </SectionCard>
        <SectionCard title="Dias perdidos (12 meses)">
          <div className="stat-big">{formatNumber(k.diasPerdidos12)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Por acidentes com afastamento</p>
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard title="Acidentes mês a mês" subtitle="Com e sem afastamento — últimos 12 meses">
          <StackedBarChart data={safety.incidentSeries} series={incidentSeries} height={240} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Inspeções realizadas" subtitle="Volume mensal">
          <LineChart history={safety.inspectionSeries.map((s) => ({ label: s.label, y: s.y }))} formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Índice de conformidade" subtitle="% de itens conformes por mês">
          <LineChart history={safety.conformitySeries.map((s) => ({ label: s.label, y: s.y }))} color="var(--chart-4)" formatValue={(v) => `${formatNumber(v, 0)}%`} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Motivos das paralisações" subtitle="Interdições por risco (12 meses)">
          <BarChart data={safety.stoppagesByReason} valueKey="value" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
        <SectionCard title="Intervenções preventivas" subtitle="Ações de SST no período">
          <BarChart data={safety.interventions} valueKey="value" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <SectionCard title="Concentração por diretoria" subtitle="Acidentes e paralisações por diretoria (12 meses)">
        <HeatmapTable rows={safety.heatmap.rows} cols={safety.heatmap.cols} formatValue={(v) => formatNumber(v)} />
      </SectionCard>
    </div>
  );
}
