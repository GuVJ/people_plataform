import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import Table from '../components/ui/Table.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';
import './Performance.css';

function NineBox({ grid }) {
  const max = Math.max(...grid.map((c) => c.count), 1);
  return (
    <div className="nine-box">
      {grid.map((cell, i) => {
        const intensity = 0.1 + (cell.count / max) * 0.7;
        return (
          <div key={i} className="nine-box-cell" style={{ background: `rgba(230, 17, 126, ${intensity})`, color: intensity > 0.45 ? '#fff' : 'var(--color-text)' }}>
            <span className="nine-box-count">{cell.count}</span>
            <span className="nine-box-caption">{cell.performance} perf. / {cell.potential} pot.</span>
          </div>
        );
      })}
      <div className="nine-box-axis nine-box-axis-x">Desempenho →</div>
      <div className="nine-box-axis nine-box-axis-y">Potencial →</div>
    </div>
  );
}

export default function Performance() {
  const { metrics } = useData();

  const exportRows = metrics.criticalTalents.map((t) => ({
    Nome: t.name, Área: t.area, Cargo: t.roleLevel, Gestor: t.managerName, Engajamento: t.engagementScore,
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Desempenho</h1>
          <p className="page-subtitle">Distribuição de performance, nine box, potenciais e talentos críticos</p>
        </div>
        <ExportButton filename="talentos_criticos" sheetName="Talentos" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Alto desempenho">
          <div className="stat-big">{formatPercent(metrics.performanceDistribution.find((p) => p.label === 'Alto')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title="Desempenho médio">
          <div className="stat-big">{formatPercent(metrics.performanceDistribution.find((p) => p.label === 'Médio')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title="Baixo desempenho">
          <div className="stat-big">{formatPercent(metrics.performanceDistribution.find((p) => p.label === 'Baixo')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title="Talentos críticos identificados">
          <div className="stat-big">{formatNumber(metrics.criticalTalents.length)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>alto desempenho + alto potencial</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Nine Box" subtitle="Desempenho x Potencial — headcount ativo">
          <NineBox grid={metrics.nineBoxGrid} />
        </SectionCard>
        <SectionCard title="Distribuição de desempenho">
          <BarChart data={metrics.performanceDistribution} valueKey="count" labelKey="label" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>

      <SectionCard title="Talentos críticos" subtitle="Alto desempenho e alto potencial — priorizar planos de retenção">
        <Table
          columns={[
            { key: 'name', label: 'Nome', render: (r) => <Link to={`/funcionario/${r.id}`}>{r.name}</Link> },
            { key: 'area', label: 'Área' },
            { key: 'roleLevel', label: 'Cargo' },
            { key: 'managerName', label: 'Gestor' },
            { key: 'engagementScore', label: 'Engajamento', align: 'right', render: (r) => formatPercent(r.engagementScore) },
          ]}
          rows={metrics.criticalTalents}
        />
      </SectionCard>
    </div>
  );
}
