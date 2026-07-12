import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import InsightCard from '../components/insights/InsightCard.jsx';
import { sparklineForKpi } from '../utils/kpiSeries.js';
import { formatNumber } from '../utils/format.js';
import './Home.css';

const QUICK_LINKS = [
  { to: '/workforce', label: 'Workforce', desc: 'Headcount, estrutura e distribuição salarial' },
  { to: '/turnover', label: 'Turnover', desc: 'Rotatividade voluntária e involuntária' },
  { to: '/recruitment', label: 'Recrutamento', desc: 'Funil, SLA e fontes de candidatos' },
  { to: '/absenteeism', label: 'Absenteísmo', desc: 'Índice, motivos e tendências' },
  { to: '/overtime', label: 'Horas Extras', desc: 'Evolução, custo e ranking por diretoria' },
  { to: '/diversity', label: 'Diversidade', desc: 'Gênero, raça, gerações e liderança' },
  { to: '/training', label: 'Treinamentos', desc: 'Horas, participação e ROI' },
  { to: '/performance', label: 'Desempenho', desc: 'Nine box, potenciais e talentos críticos' },
];

export default function Home() {
  const { metrics, insights } = useData();
  const { privacyMode } = usePreferences();
  const { user } = useAuth();

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Boa tarde, {user.name.split(' ')[0]}</h1>
          <p className="page-subtitle">
            Resumo executivo · {formatNumber(metrics.activeNow.length)} colaboradores ativos · atualizado com base no fechamento de {metrics.labels[metrics.labels.length - 1]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 kpi-grid">
        {metrics.kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} sparklineValues={sparklineForKpi(metrics, kpi.key)} privacyMode={privacyMode && (kpi.key === 'custoPessoal' || kpi.key === 'horasExtras')} />
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <span>Insights automáticos</span>
        <span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>Gerados pelo Copiloto a partir dos dados do período</span>
      </div>
      <div className="grid grid-cols-3">
        {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <span>Explorar dashboards</span>
      </div>
      <div className="grid grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link to={link.to} key={link.to} className="card card-hover quick-link">
            <span className="quick-link-title">{link.label}</span>
            <span className="quick-link-desc">{link.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
