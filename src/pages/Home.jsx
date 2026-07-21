import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import InsightCard from '../components/insights/InsightCard.jsx';
import ExecutiveSummaryTable from '../components/summary/ExecutiveSummaryTable.jsx';
import { buildExecutiveSummary } from '../data/executiveSummary.js';
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
  const { targets } = useBudget();
  const { user } = useAuth();

  const summaryRows = useMemo(() => buildExecutiveSummary(metrics, targets), [metrics, targets]);
  const period = metrics.labels[metrics.labels.length - 1];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Boa tarde, {user.name.split(' ')[0]}</h1>
          <p className="page-subtitle">
            Resumo executivo · {formatNumber(metrics.activeNow.length)} colaboradores ativos · atualizado com base no fechamento de {period}
          </p>
        </div>
      </div>

      <SectionCard
        title="Resumo executivo do mês"
        subtitle={`Mês atual (${period}) vs. mês anterior · barra de meta onde há orçamento definido`}
      >
        <ExecutiveSummaryTable rows={summaryRows} />
      </SectionCard>

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
