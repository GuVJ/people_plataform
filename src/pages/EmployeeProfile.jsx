import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import Sparkline from '../components/ui/Sparkline.jsx';
import AIInsightPanel from '../components/profile/AIInsightPanel.jsx';
import EmployeeSearch from '../components/orgchart/EmployeeSearch.jsx';
import { RISK_LEVEL_COLOR } from '../data/risk.js';
import { buildLocalEmployeeInsight, buildEmployeeCopilotContext } from '../data/employeeInsight.js';
import { monthKey } from '../utils/dates.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import '../components/profile/profile.css';

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const employeeId = Number(id);
  const { employees, metrics, risk } = useData();
  const { privacyMode } = usePreferences();

  const employee = useMemo(() => employees.find((e) => e.id === employeeId), [employees, employeeId]);
  const riskEntry = useMemo(() => risk.find((r) => r.id === employeeId), [risk, employeeId]);

  const directReports = useMemo(
    () => (employee?.isLeadership ? employees.filter((e) => e.status === 'Ativo' && e.managerId === employee.id) : []),
    [employees, employee],
  );
  const peers = useMemo(
    () => (employee && !employee.isLeadership && employee.managerId
      ? employees.filter((e) => e.status === 'Ativo' && e.managerId === employee.managerId && e.id !== employee.id)
      : []),
    [employees, employee],
  );

  const monthlySeries = useMemo(() => {
    if (!employee) return { absence: [], overtime: [] };
    const recentMonths = metrics.months.slice(-12);
    return {
      absence: recentMonths.map((m) => employee.monthlyAbsence.get(monthKey(m))?.days ?? 0),
      overtime: recentMonths.map((m) => employee.monthlyOvertime.get(monthKey(m)) ?? 0),
    };
  }, [employee, metrics.months]);

  if (!employee) {
    return (
      <div className="page fade-in">
        <div className="profile-not-found">
          <h2>Funcionário não encontrado</h2>
          <p className="text-secondary" style={{ marginTop: 8, marginBottom: 20 }}>Nenhum colaborador com a matrícula #{id}.</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <EmployeeSearch employees={metrics.activeNow} />
          </div>
        </div>
      </div>
    );
  }

  const localInsight = buildLocalEmployeeInsight({ employee, riskEntry, referenceDate: metrics.referenceDate });
  const geminiContext = buildEmployeeCopilotContext({ employee, riskEntry, metrics, referenceDate: metrics.referenceDate });

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <Link to="/organograma" className="text-secondary" style={{ fontSize: 12 }}>← Voltar ao organograma</Link>
          <h1 style={{ marginTop: 6 }}>Ficha do funcionário</h1>
        </div>
        <EmployeeSearch employees={metrics.activeNow} />
      </div>

      <div className="card profile-header">
        <div className="profile-avatar">{initials(employee.name)}</div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <span className="profile-name">{employee.name}</span>
            <span className={`badge ${employee.status === 'Ativo' ? 'badge-success' : 'badge-danger'}`}>{employee.status}</span>
            {employee.isLeadership && <span className="badge badge-info">Liderança</span>}
          </div>
          <p className="profile-role">{employee.roleLevel} · {employee.area} · Matrícula #{employee.id}</p>
          <div className="profile-meta-row">
            <span>Unidade: {employee.unit}</span>
            <span>Gestor: {employee.managerId ? <Link to={`/funcionario/${employee.managerId}`}>{employee.managerName}</Link> : employee.managerName}</span>
            <span>Admissão: {employee.admissionDate.toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AIInsightPanel
          cacheKey={employee.id}
          question={`Gere uma análise executiva e acionável sobre este colaborador (2 a 4 frases), com base nos dados fornecidos.`}
          context={geminiContext}
          localText={localInsight.text}
        />
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Dados cadastrais">
          <div className="fact-grid">
            <div className="fact-item"><span className="fact-label">Gênero</span><span className="fact-value">{employee.gender}</span></div>
            <div className="fact-item"><span className="fact-label">Raça/Etnia</span><span className="fact-value">{employee.race}</span></div>
            <div className="fact-item"><span className="fact-label">Geração</span><span className="fact-value">{employee.generation}</span></div>
            <div className="fact-item"><span className="fact-label">Idade</span><span className="fact-value">{employee.age} anos</span></div>
            <div className="fact-item"><span className="fact-label">PCD</span><span className="fact-value">{employee.pcd ? employee.pcdType : 'Não'}</span></div>
            <div className="fact-item"><span className="fact-label">Tempo de casa</span><span className="fact-value">{formatNumber(employee.tenureYears, 1)} anos</span></div>
            <div className="fact-item">
              <span className="fact-label">Salário</span>
              <span className={`fact-value${privacyMode ? ' privacy-blur' : ''}`}>{formatCurrency(employee.salary)}</span>
            </div>
            <div className="fact-item"><span className="fact-label">Saldo de férias</span><span className="fact-value">{employee.vacationBalance} dias</span></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <span className="fact-label">Benefícios</span>
            <div className="benefit-chips" style={{ marginTop: 8 }}>
              {employee.benefits.map((b) => <span key={b} className="benefit-chip">{b}</span>)}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Desempenho e risco">
          <div className="profile-stat-row">
            <span className="profile-stat-label">Desempenho</span>
            <span className="profile-stat-value">{employee.performanceBucket}</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">Potencial</span>
            <span className="profile-stat-value">{employee.potential}</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">Engajamento</span>
            <span className="profile-stat-value">{formatPercent(employee.engagementScore)}</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">Clima organizacional</span>
            <span className="profile-stat-value">{formatNumber(employee.climateScore, 1)} / 5</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">Promoções</span>
            <span className="profile-stat-value">{employee.promotions}</span>
          </div>
          {riskEntry && (
            <>
              <div className="profile-stat-row">
                <span className="profile-stat-label">Risco de saída</span>
                <span className="profile-stat-value">
                  <span className={`badge badge-${RISK_LEVEL_COLOR[riskEntry.level]}`}>{riskEntry.level} · {riskEntry.score}/100</span>
                </span>
              </div>
              <div className="risk-factor-list">
                {riskEntry.factors.map((f, i) => (
                  <span key={i} className={`risk-factor-chip ${f.impact > 0 ? 'up' : 'down'}`} style={{ alignSelf: 'flex-start' }}>
                    {f.impact > 0 ? '+' : ''}{f.impact} {f.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Absenteísmo" subtitle="Dias perdidos por mês — últimos 12 meses">
          <Sparkline values={monthlySeries.absence.length > 1 ? monthlySeries.absence : [0, 0]} width={260} height={60} color="var(--color-warning)" />
        </SectionCard>
        <SectionCard title="Horas extras" subtitle="Horas por mês — últimos 12 meses">
          <Sparkline values={monthlySeries.overtime.length > 1 ? monthlySeries.overtime : [0, 0]} width={260} height={60} color="var(--color-info)" />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Treinamentos concluídos" subtitle={`${formatNumber(employee.trainingHoursYear)}h no ano`}>
          {employee.trainingsCompleted.length === 0
            ? <p className="text-secondary" style={{ fontSize: 12.5 }}>Nenhum treinamento registrado ainda.</p>
            : <div className="training-chip-list">{employee.trainingsCompleted.map((t, i) => <span key={i} className="benefit-chip">{t}</span>)}</div>}
        </SectionCard>

        <SectionCard title={employee.isLeadership ? `Time (${directReports.length})` : `Colegas de time (${peers.length})`}>
          <div className="team-list">
            {(employee.isLeadership ? directReports : peers).slice(0, 10).map((t) => (
              <Link to={`/funcionario/${t.id}`} key={t.id} className="team-row">
                <span className="org-avatar">{initials(t.name)}</span>
                <span>
                  <span className="org-report-name">{t.name}</span>
                  <span className="org-report-role">{t.roleLevel}</span>
                </span>
              </Link>
            ))}
            {(employee.isLeadership ? directReports : peers).length === 0 && (
              <p className="text-secondary" style={{ fontSize: 12.5 }}>Nenhum registro disponível.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
