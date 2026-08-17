import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import InsightCard from '../components/insights/InsightCard.jsx';
import ExecutiveSummaryTable from '../components/summary/ExecutiveSummaryTable.jsx';
import { buildExecutiveSummary } from '../data/executiveSummary.js';
import { formatNumber } from '../utils/format.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import './Home.css';

const QUICK_LINKS = [
  { to: '/workforce', label: 'Workforce', descKey: 'ql.workforce.desc' },
  { to: '/turnover', label: 'Turnover', descKey: 'ql.turnover.desc' },
  { to: '/recruitment', label: 'Recrutamento', descKey: 'ql.recruitment.desc' },
  { to: '/absenteeism', label: 'Absenteísmo', descKey: 'ql.absenteeism.desc' },
  { to: '/overtime', label: 'Horas Extras', descKey: 'ql.overtime.desc' },
  { to: '/diversity', label: 'Diversidade', descKey: 'ql.diversity.desc' },
  { to: '/training', label: 'Treinamentos', descKey: 'ql.training.desc' },
  { to: '/performance', label: 'Desempenho', descKey: 'ql.performance.desc' },
];

export default function Home() {
  const { metrics, insights } = useData();
  const { targets } = useBudget();
  const { t, tNav } = useLang();

  const summaryRows = useMemo(() => buildExecutiveSummary(metrics, targets), [metrics, targets]);
  const period = metrics.labels[metrics.labels.length - 1];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{t('home.title')}</h1>
          <p className="page-subtitle">
            Volttera Motors · {t('home.carMaker')} · {formatNumber(metrics.activeNow.length)} {t('home.activeEmployees')} · {t('home.closing')} {period}
          </p>
        </div>
      </div>

      <SectionCard title={t('home.execSummary')} className="exec-summary-card">
        <ExecutiveSummaryTable rows={summaryRows} />
      </SectionCard>

      <div className="section-title" style={{ marginTop: 28 }}>
        <span>{t('home.autoInsights')}</span>
        <span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>{t('home.autoInsightsSub')}</span>
      </div>
      <div className="grid grid-cols-3">
        {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <span>{t('home.explore')}</span>
      </div>
      <div className="grid grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link to={link.to} key={link.to} className="card card-hover quick-link">
            <span className="quick-link-title">{tNav(link.to, link.label)}</span>
            <span className="quick-link-desc">{t(link.descKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
