import { useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import AIInsightPanel from '../components/profile/AIInsightPanel.jsx';
import ComparisonBar from '../components/profile/ComparisonBar.jsx';
import SeveranceSimulator from '../components/profile/SeveranceSimulator.jsx';
import EmployeeSearch from '../components/orgchart/EmployeeSearch.jsx';
import { RISK_LEVEL_COLOR } from '../data/risk.js';
import { buildLocalEmployeeInsight, buildEmployeeCopilotContext } from '../data/employeeInsight.js';
import { buildEmployeeBenchmark } from '../data/employeeBenchmark.js';
import { simulateSeverance, SEVERANCE_SCENARIOS } from '../data/severanceSimulator.js';
import { requiresEpi, getEpiSummary } from '../data/epiRequirements.js';
import { monthKey, diffInMonths } from '../utils/dates.js';
import { formatCurrency, formatNumber, formatPercent, managerLabel } from '../utils/format.js';
import '../components/profile/profile.css';

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
}

// Linha de detalhe do EPI (entrega/validade), com frase natural em PT e EN.
function epiDetail(item, lang) {
  const en = lang === 'en';
  const ca = `CA ${item.caNumber}`;
  if (item.status === 'ok') {
    const n = item.lastDeliveryDaysAgo;
    return en ? `issued ${n} days ago · ${ca}` : `entregue há ${n} dias · ${ca}`;
  }
  if (item.status === 'expiring') {
    const n = item.daysToChange;
    return en ? `replace in ${n} ${n === 1 ? 'day' : 'days'} · ${ca}` : `troca em ${n} ${n === 1 ? 'dia' : 'dias'} · ${ca}`;
  }
  if (item.status === 'expired') {
    const n = item.expiredDaysAgo;
    return en ? `expired ${n} ${n === 1 ? 'day' : 'days'} ago · ${ca}` : `vencido há ${n} ${n === 1 ? 'dia' : 'dias'} · ${ca}`;
  }
  return ca;
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const employeeId = Number(id);
  const { employees, metrics, risk } = useData();
  const { privacyMode } = usePreferences();
  const { tx, lang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const fromOrgChart = location.state?.from === 'organograma';

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

  const benchmark = useMemo(
    () => (employee ? buildEmployeeBenchmark({ employee, riskEntry, activeNow: metrics.activeNow, risk }) : null),
    [employee, riskEntry, metrics.activeNow, risk],
  );

  const monthlySeries = useMemo(() => {
    if (!employee) return { absence: [], overtime: [] };
    const recentMonths = metrics.months.slice(-12);
    const recentLabels = metrics.labels.slice(-12);
    return {
      absence: recentMonths.map((m, i) => ({ month: m, label: recentLabels[i], y: employee.monthlyAbsence.get(monthKey(m))?.days ?? 0 })),
      overtime: recentMonths.map((m, i) => ({ month: m, label: recentLabels[i], y: employee.monthlyOvertime.get(monthKey(m)) ?? 0 })),
    };
  }, [employee, metrics.months, metrics.labels]);

  if (!employee) {
    return (
      <div className="page fade-in">
        <div className="profile-not-found">
          <h2>{tx('Funcionário não encontrado')}</h2>
          <p className="text-secondary" style={{ marginTop: 8, marginBottom: 20 }}>{tx('Nenhum colaborador com a matrícula')} #{id}.</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <EmployeeSearch employees={metrics.activeNow} />
          </div>
        </div>
      </div>
    );
  }

  const localInsight = buildLocalEmployeeInsight({ employee, riskEntry, referenceDate: metrics.referenceDate });
  const geminiContext = buildEmployeeCopilotContext({ employee, riskEntry, metrics, referenceDate: metrics.referenceDate });

  // Tempo de casa em anos e meses (admissão → desligamento, se desligado; senão até hoje).
  const tenureEndDate = employee.terminationDate || metrics.referenceDate;
  const tenureMonthsTotal = Math.max(0, diffInMonths(employee.admissionDate, tenureEndDate));
  const tenureY = Math.floor(tenureMonthsTotal / 12);
  const tenureM = tenureMonthsTotal % 12;
  const tenureLabel = `${tenureY} ${tenureY === 1 ? tx('ano') : tx('anos')}${tenureM ? ` ${tx('e')} ${tenureM} ${tenureM === 1 ? tx('mês') : tx('meses')}` : ''}`;

  // Rescisão efetivamente paga (para desligados): cenário conforme o tipo de desligamento.
  const terminationScenario = employee.terminationType === 'Voluntário' ? 'pedido_demissao' : 'sem_justa_causa';
  const severancePaid = employee.status !== 'Ativo' && employee.terminationDate
    ? simulateSeverance({ employee, scenario: terminationScenario, referenceDate: employee.terminationDate })
    : null;
  const scenarioLabel = SEVERANCE_SCENARIOS.find((s) => s.key === terminationScenario)?.label;

  // EPI: só aparece para funções que exigem (áreas operacionais / chão de fábrica).
  const epiRequired = requiresEpi(employee);
  const epiSummary = epiRequired ? getEpiSummary(employee) : null;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          {fromOrgChart ? (
            <Link to="/organograma" className="text-secondary" style={{ fontSize: 12 }}>← {tx('Voltar ao organograma')}</Link>
          ) : (
            <button type="button" onClick={() => navigate(-1)} className="profile-back-btn">← {tx('Voltar')}</button>
          )}
          <h1 style={{ marginTop: 6 }}>{tx('Ficha do funcionário')}</h1>
        </div>
        <EmployeeSearch employees={metrics.activeNow} />
      </div>

      <div className="card profile-header">
        <div className="profile-avatar">{initials(employee.name)}</div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <span className="profile-name">{employee.name}</span>
            <span className={`badge ${employee.status === 'Ativo' ? 'badge-success' : 'badge-danger'}`}>{tx(employee.status)}</span>
            {employee.isLeadership && <span className="badge badge-info">{tx('Liderança')}</span>}
          </div>
          <p className="profile-role">{tx(employee.roleLevel)} · {tx(employee.area)} · {tx('Matrícula')} #{employee.id}</p>
          <div className="profile-meta-row">
            <span>{tx('Unidade:')} {employee.unit}</span>
            <span>{tx('Gestor:')} {employee.managerId ? <Link to={`/funcionario/${employee.managerId}`}>{employee.managerName}</Link> : managerLabel(employee.managerName, lang)}</span>
            <span>{tx('Admissão:')} {employee.admissionDate.toLocaleDateString('pt-BR')}</span>
            {employee.terminationDate && <span>{tx('Desligamento:')} {employee.terminationDate.toLocaleDateString('pt-BR')}</span>}
            <span>{tx('Tempo de casa:')} {tenureLabel}</span>
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
        <SectionCard title={tx('Dados cadastrais')}>
          <div className="fact-grid">
            <div className="fact-item"><span className="fact-label">{tx('Gênero')}</span><span className="fact-value">{tx(employee.gender)}</span></div>
            <div className="fact-item"><span className="fact-label">{tx('Raça/Etnia')}</span><span className="fact-value">{tx(employee.race)}</span></div>
            <div className="fact-item"><span className="fact-label">{tx('Geração')}</span><span className="fact-value">{tx(employee.generation)}</span></div>
            <div className="fact-item"><span className="fact-label">{tx('Idade')}</span><span className="fact-value">{employee.age} {tx('anos')}</span></div>
            <div className="fact-item"><span className="fact-label">{tx('PCD')}</span><span className="fact-value">{employee.pcd ? tx(employee.pcdType) : tx('Não')}</span></div>
            <div className="fact-item"><span className="fact-label">{tx('Tempo de casa')}</span><span className="fact-value">{tenureLabel}</span></div>
            <div className="fact-item">
              <span className="fact-label">{tx('Salário')}</span>
              <span className={`fact-value${privacyMode ? ' privacy-blur' : ''}`}>{formatCurrency(employee.salary)}</span>
            </div>
            <div className="fact-item"><span className="fact-label">{tx('Saldo de férias')}</span><span className="fact-value">{employee.vacationBalance} {tx('dias')}</span></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <span className="fact-label">{tx('Benefícios')}</span>
            <div className="benefit-chips" style={{ marginTop: 8 }}>
              {employee.benefits.map((b) => <span key={b} className="benefit-chip">{tx(b)}</span>)}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={tx('Desempenho e risco')}>
          <div className="profile-stat-row">
            <span className="profile-stat-label">{tx('Desempenho')}</span>
            <span className="profile-stat-value">{tx(employee.performanceBucket)}</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">{tx('Potencial')}</span>
            <span className="profile-stat-value">{tx(employee.potential)}</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">{tx('Engajamento')}</span>
            <span className="profile-stat-value">{formatPercent(employee.engagementScore)}</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">{tx('Clima organizacional')}</span>
            <span className="profile-stat-value">{formatNumber(employee.climateScore, 1)} / 5</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">{tx('Promoções')}</span>
            <span className="profile-stat-value">{employee.promotions}</span>
          </div>
          {riskEntry && (
            <>
              <div className="profile-stat-row">
                <span className="profile-stat-label">{tx('Risco de saída')}</span>
                <span className="profile-stat-value">
                  <span className={`badge badge-${RISK_LEVEL_COLOR[riskEntry.level]}`}>{tx(riskEntry.level)} · {riskEntry.score}/100</span>
                </span>
              </div>
              {benchmark.riskPercentile !== null && (
                <p className="text-secondary" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 8 }}>
                  {tx('Risco maior que')} {benchmark.riskPercentile}% {tx('dos colaboradores de')} {employee.area}.
                </p>
              )}
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

      <div style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Comparativos')} subtitle={`${tx('Frente aos')} ${benchmark.areaPeerCount} ${tx('colaboradores ativos de')} ${employee.area}`}>
          <div className="grid grid-cols-2">
            <div>
              <ComparisonBar
                label="Salário"
                value={benchmark.salary.value}
                reference={benchmark.salary.reference}
                diffPct={benchmark.salary.diffPct}
                format={(v) => formatCurrency(v, { compact: true })}
                referenceLabel="mediana da diretoria"
                higherIsBetter={null}
              />
              <ComparisonBar
                label="Engajamento"
                value={benchmark.engagement.value}
                reference={benchmark.engagement.referenceCompany}
                diffPct={benchmark.engagement.diffPct}
                format={(v) => formatPercent(v)}
                referenceLabel="média da empresa"
                higherIsBetter
              />
            </div>
            <div>
              {benchmark.performance && (
                <ComparisonBar
                  label="Desempenho"
                  value={benchmark.performance.value}
                  reference={benchmark.performance.reference}
                  diffPct={benchmark.performance.diffPct}
                  format={(v) => formatNumber(v, 1)}
                  referenceLabel="média da diretoria"
                  higherIsBetter
                />
              )}
              <ComparisonBar
                label="Tempo de casa"
                value={benchmark.tenure.value}
                reference={benchmark.tenure.reference}
                diffPct={benchmark.tenure.diffPct}
                format={(v) => `${formatNumber(v, 1)} anos`}
                referenceLabel="média da diretoria"
                higherIsBetter={null}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {epiRequired && epiSummary && (
        <div style={{ marginBottom: 16 }}>
          <SectionCard
            title={tx('EPIs obrigatórios da função')}
            subtitle={`${epiSummary.inHand}/${epiSummary.total} ${tx('em posse')} · ${epiSummary.compliant} ${tx('em dia')}${epiSummary.issues ? ` · ${epiSummary.issues} ${tx('pendências')}` : ''}`}
          >
            <div className="epi-list">
              {epiSummary.items.map((item) => (
                <div className="epi-row" key={item.key}>
                  <span className={`epi-possui epi-possui-${item.has ? 'yes' : 'no'}`}>
                    {item.has ? '✓' : '✗'} {item.has ? tx('Sim') : tx('Não')}
                  </span>
                  <div className="epi-row-info">
                    <span className="epi-row-name">{tx(item.name)}</span>
                    <span className="epi-row-detail">{epiDetail(item, lang)}</span>
                  </div>
                  <span className={`badge badge-${item.tone}`}>{tx(item.statusLabel)}</span>
                </div>
              ))}
            </div>
            <p className="text-secondary" style={{ fontSize: 11.5, marginTop: 10 }}>
              {tx('Situação de entrega e validade do Certificado de Aprovação (CA) — dados ilustrativos.')}
            </p>
          </SectionCard>
        </div>
      )}

      {employee.status === 'Ativo' && (
        <div style={{ marginBottom: 16 }}>
          <SectionCard title={tx('Simulação de custo de rescisão')} subtitle={tx('Estimativa CLT para desligamento na data de hoje')}>
            <SeveranceSimulator employee={employee} referenceDate={metrics.referenceDate} privacyMode={privacyMode} />
          </SectionCard>
        </div>
      )}

      {severancePaid && (
        <div style={{ marginBottom: 16 }}>
          <SectionCard
            title={tx('Rescisão paga')}
            subtitle={`${tx(scenarioLabel)} · ${tx('desligado em')} ${employee.terminationDate.toLocaleDateString('pt-BR')}${employee.terminationReason ? ` · ${employee.terminationReason}` : ''}`}
          >
            <div className="severance-paid-total">
              <span className="fact-label">{tx('Total pago em verbas rescisórias')}</span>
              <span className={`stat-big${privacyMode ? ' privacy-blur' : ''}`}>{formatCurrency(severancePaid.total)}</span>
              {severancePaid.saqueFgts > 0 && (
                <span className="text-secondary" style={{ fontSize: 12 }}>
                  + {tx('saque de FGTS de')} <span className={privacyMode ? 'privacy-blur' : ''}>{formatCurrency(severancePaid.saqueFgts, { compact: true })}</span>
                </span>
              )}
            </div>
            <div className="severance-list">
              {severancePaid.components.map((c) => (
                <div className="severance-row" key={c.key}>
                  <div className="severance-row-info">
                    <span className="severance-row-label">{tx(c.label)}</span>
                    <span className="severance-row-desc">{tx(c.description)}</span>
                  </div>
                  <span className={`severance-row-value${privacyMode ? ' privacy-blur' : ''}`}>{formatCurrency(c.value)}</span>
                </div>
              ))}
              <div className="severance-row severance-row-total">
                <span>{tx('Total das verbas')}</span>
                <span className={privacyMode ? 'privacy-blur' : ''}>{formatCurrency(severancePaid.total)}</span>
              </div>
            </div>
            <p className="text-secondary" style={{ fontSize: 11.5, marginTop: 10 }}>
              {tx('Estimativa CLT para referência de RH/Financeiro — não substitui o cálculo oficial da folha (FGTS com juros, férias vencidas e adicionais).')}
            </p>
          </SectionCard>
        </div>
      )}

      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('Absenteísmo')} subtitle={tx('Dias perdidos por mês — últimos 12 meses')}>
          <LineChart history={monthlySeries.absence} color="var(--color-warning)" height={160} formatValue={(v) => formatNumber(v, 0)} />
        </SectionCard>
        <SectionCard title={tx('Horas extras')} subtitle={tx('Horas por mês — últimos 12 meses')}>
          <LineChart history={monthlySeries.overtime} color="var(--color-info)" height={160} formatValue={(v) => formatNumber(v, 0)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Treinamentos concluídos')} subtitle={`${formatNumber(employee.trainingHoursYear)}${tx('h no ano')}`}>
          {employee.trainingsCompleted.length === 0
            ? <p className="text-secondary" style={{ fontSize: 12.5 }}>{tx('Nenhum treinamento registrado ainda.')}</p>
            : <div className="training-chip-list">{employee.trainingsCompleted.map((t, i) => <span key={i} className="benefit-chip">{tx(t)}</span>)}</div>}
        </SectionCard>

        <SectionCard title={employee.isLeadership ? `${tx('Time')} (${directReports.length})` : `${tx('Colegas de time')} (${peers.length})`}>
          <div className="team-list">
            {(employee.isLeadership ? directReports : peers).slice(0, 10).map((t) => (
              <Link to={`/funcionario/${t.id}`} key={t.id} className="team-row">
                <span className="org-avatar">{initials(t.name)}</span>
                <span>
                  <span className="org-report-name">{t.name}</span>
                  <span className="org-report-role">{tx(t.roleLevel)}</span>
                </span>
              </Link>
            ))}
            {(employee.isLeadership ? directReports : peers).length === 0 && (
              <p className="text-secondary" style={{ fontSize: 12.5 }}>{tx('Nenhum registro disponível.')}</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
