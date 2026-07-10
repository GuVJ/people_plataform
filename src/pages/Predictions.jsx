import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import Table from '../components/ui/Table.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';
import { formatByType } from '../components/ui/formatValue.js';
import { RISK_LEVEL_COLOR } from '../data/risk.js';
import './Predictions.css';

function RiskBadge({ level }) {
  return <span className={`badge badge-${RISK_LEVEL_COLOR[level]}`}>{level}</span>;
}

export default function Predictions() {
  const { metrics, forecasts, risk } = useData();

  const riskCounts = ['Baixo', 'Médio', 'Alto', 'Muito Alto'].map((level) => ({
    level, count: risk.filter((r) => r.level === level).length,
  }));

  const topRisk = risk.slice(0, 15);

  const exportRows = risk.map((r) => ({
    Nome: r.name, Área: r.area, Cargo: r.roleLevel, Gestor: r.managerName, Score: r.score, Nível: r.level,
  }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Preditivo &amp; Machine Learning</h1>
          <p className="page-subtitle">Modelos de previsão para os principais indicadores e classificação de risco de saída</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/organograma" className="btn btn-sm">Ver organograma</Link>
          <ExportButton filename="risco_colaboradores" sheetName="Risco" rows={exportRows} />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        {forecasts.map((f) => {
          const trendUp = f.result.trendPct >= 0;
          const goodIsDown = ['turnover', 'absenteismo', 'horasExtras', 'desligamentos'].includes(f.key);
          const isGood = goodIsDown ? !trendUp : trendUp;
          return (
            <SectionCard
              key={f.key}
              title={f.label}
              subtitle={`Projeção para os próximos 3 meses`}
              action={<span className={`badge ${isGood ? 'badge-success' : 'badge-warning'}`}>{trendUp ? '↑' : '↓'} {formatNumber(Math.abs(f.result.trendPct), 1)}%</span>}
            >
              <LineChart history={f.result.history} forecast={f.result.forecast} formatValue={(v) => formatByType(v, f.format)} />
              <div className="forecast-footer">
                <span>Último real: <strong>{formatByType(f.result.history.at(-1).y, f.format)}</strong></span>
                <span>Projeção ({f.result.forecast.at(-1).label}): <strong>{formatByType(f.result.forecast.at(-1).y, f.format)}</strong></span>
              </div>
            </SectionCard>
          );
        })}
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        {riskCounts.map((r) => (
          <SectionCard key={r.level} title={`Risco ${r.level}`}>
            <div className="stat-big"><RiskBadge level={r.level} /></div>
            <p className="text-secondary" style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{formatNumber(r.count)}</p>
            <p className="text-secondary" style={{ fontSize: 12 }}>{formatPercent((r.count / (risk.length || 1)) * 100)} do quadro ativo</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Colaboradores com maior risco de saída" subtitle="Score calculado a partir de tenure, engajamento, clima, salário, horas extras e absenteísmo">
        <Table
          columns={[
            { key: 'name', label: 'Nome', render: (r) => <Link to={`/funcionario/${r.id}`}>{r.name}</Link> },
            { key: 'area', label: 'Área' },
            { key: 'managerName', label: 'Gestor' },
            { key: 'score', label: 'Score', align: 'right' },
            { key: 'level', label: 'Nível', render: (r) => <RiskBadge level={r.level} /> },
            {
              key: 'factors', label: 'Principais fatores', render: (r) => (
                <div className="risk-factors">
                  {r.factors.map((f, i) => (
                    <span key={i} className={`risk-factor-chip ${f.impact > 0 ? 'up' : 'down'}`}>
                      {f.impact > 0 ? '+' : ''}{f.impact} {f.label}
                    </span>
                  ))}
                </div>
              ),
            },
          ]}
          rows={topRisk}
        />
      </SectionCard>
    </div>
  );
}
