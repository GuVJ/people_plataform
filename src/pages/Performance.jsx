import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import Table from '../components/ui/Table.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import DashboardFilters from '../components/ui/DashboardFilters.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { formatNumber, formatPercent, managerLabel } from '../utils/format.js';
import { PRIMARY_RGB } from '../utils/colors.js';
import './Performance.css';

function NineBox({ grid }) {
  const { tx } = useLang();
  const max = Math.max(...grid.map((c) => c.count), 1);
  return (
    <div className="nine-box">
      {grid.map((cell, i) => {
        const intensity = 0.1 + (cell.count / max) * 0.7;
        return (
          <div key={i} className="nine-box-cell" style={{ background: `rgba(${PRIMARY_RGB}, ${intensity})`, color: intensity > 0.45 ? '#fff' : 'var(--color-text)' }}>
            <span className="nine-box-count">{cell.count}</span>
            <span className="nine-box-caption">{cell.performance} {tx('perf.')} / {cell.potential} {tx('pot.')}</span>
          </div>
        );
      })}
      <div className="nine-box-axis nine-box-axis-x">{tx('Desempenho')} →</div>
      <div className="nine-box-axis nine-box-axis-y">{tx('Potencial')} →</div>
    </div>
  );
}

export default function Performance() {
  const { tx, lang } = useLang();
  const { metrics } = useDashboardData();

  const exportRows = metrics.criticalTalents.map((t) => ({
    Nome: t.name, Diretoria: t.area, Cargo: t.roleLevel, Gestor: t.managerName, Engajamento: t.engagementScore,
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Desempenho')}</h1>
          <p className="page-subtitle">{tx('Distribuição de performance, nine box, potenciais e talentos críticos')}</p>
        </div>
        <ExportButton filename="talentos_criticos" sheetName="Talentos" rows={exportRows} />
      </div>

      <DashboardFilters />

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Alto desempenho')}>
          <div className="stat-big">{formatPercent(metrics.performanceDistribution.find((p) => p.label === 'Alto')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title={tx('Desempenho médio')}>
          <div className="stat-big">{formatPercent(metrics.performanceDistribution.find((p) => p.label === 'Médio')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title={tx('Baixo desempenho')}>
          <div className="stat-big">{formatPercent(metrics.performanceDistribution.find((p) => p.label === 'Baixo')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title={tx('Talentos críticos identificados')}>
          <div className="stat-big">{formatNumber(metrics.criticalTalents.length)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('alto desempenho + alto potencial')}</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Nine Box" subtitle={tx('Desempenho x Potencial — headcount ativo')}>
          <NineBox grid={metrics.nineBoxGrid} />
        </SectionCard>
        <SectionCard title={tx('Distribuição de desempenho')}>
          <BarChart data={metrics.performanceDistribution} valueKey="count" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <SectionCard title={tx('Talentos críticos')} subtitle={tx('Alto desempenho e alto potencial — priorizar planos de retenção')}>
        <Table
          columns={[
            { key: 'name', label: tx('Nome'), render: (r) => <Link to={`/funcionario/${r.id}`}>{r.name}</Link> },
            { key: 'area', label: tx('Diretoria'), render: (r) => tx(r.area) },
            { key: 'roleLevel', label: tx('Cargo'), render: (r) => tx(r.roleLevel) },
            { key: 'managerName', label: tx('Gestor'), render: (r) => managerLabel(r.managerName, lang) },
            { key: 'engagementScore', label: tx('Engajamento'), align: 'right', render: (r) => formatPercent(r.engagementScore) },
          ]}
          rows={metrics.criticalTalents}
        />
      </SectionCard>
    </div>
  );
}
