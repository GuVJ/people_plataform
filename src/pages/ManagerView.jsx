import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import Table from '../components/ui/Table.jsx';
import AIInsightPanel from '../components/profile/AIInsightPanel.jsx';
import { RISK_LEVEL_COLOR } from '../data/risk.js';
import { buildManagerView } from '../data/managerView.js';
import { buildLocalManagerInsight, buildManagerCopilotContext } from '../data/managerInsight.js';
import { formatNumber, formatPercent } from '../utils/format.js';
import { PRIMARY_RGB, HEAT_RGB } from '../utils/colors.js';
import './ManagerView.css';

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('');
}

function pickDefaultManager(managers, employees) {
  let best = managers[0];
  let bestCount = -1;
  for (const m of managers) {
    const count = employees.filter((e) => e.managerId === m.id && e.status === 'Ativo').length;
    if (count > bestCount) { bestCount = count; best = m; }
  }
  return best;
}

export default function ManagerView() {
  const { employees, metrics, risk } = useData();
  const { tx } = useLang();
  const managers = useMemo(() => metrics.activeNow.filter((e) => e.isLeadership).sort((a, b) => a.area.localeCompare(b.area) || a.name.localeCompare(b.name)), [metrics.activeNow]);
  const [managerId, setManagerId] = useState(() => pickDefaultManager(managers, employees).id);

  const view = useMemo(
    () => buildManagerView({ managerId: Number(managerId), employees, risk, months: metrics.months, referenceDate: metrics.referenceDate }),
    [managerId, employees, risk, metrics.months, metrics.referenceDate],
  );

  if (!view) return null;

  const localInsight = buildLocalManagerInsight(view);
  const geminiContext = buildManagerCopilotContext(view);
  const maxNineBox = Math.max(...view.nineBoxGrid.map((c) => c.count), 1);
  const maxOvertime = Math.max(...view.roster.map((r) => r.recentOvertimeHours || 0), 1);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Visão do Gestor')}</h1>
          <p className="page-subtitle">{tx('Indicadores do time — escopo restrito aos reportes diretos do gestor selecionado')}</p>
        </div>
        <select className="manager-select" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {tx(m.area)}</option>)}
        </select>
      </div>

      <div className="card manager-header">
        <span className="manager-avatar">{initials(view.manager.name)}</span>
        <div>
          <Link to={`/funcionario/${view.manager.id}`} className="manager-header-name">{view.manager.name}</Link>
          <p className="text-secondary" style={{ fontSize: 12.5, marginTop: 2 }}>{view.manager.roleLevel} · {view.manager.area} · {view.headcount} {view.headcount !== 1 ? tx('reportes diretos') : tx('reporte direto')}</p>
        </div>
      </div>

      {view.headcount === 0 ? (
        <SectionCard><p className="text-secondary">{tx('Este gestor ainda não possui reportes diretos ativos.')}</p></SectionCard>
      ) : (
        <>
          <div style={{ margin: '16px 0' }}>
            <AIInsightPanel
              cacheKey={managerId}
              question="Gere uma análise executiva e acionável sobre este time de gestão (2 a 4 frases), com base nos dados fornecidos."
              context={geminiContext}
              localText={localInsight.text}
            />
          </div>

          <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
            <SectionCard title={tx('Headcount do time')}><div className="stat-big">{formatNumber(view.headcount)}</div></SectionCard>
            <SectionCard title={tx('Turnover do time (12m)')}><div className="stat-big">{formatPercent(view.turnoverRate)}</div></SectionCard>
            <SectionCard title={tx('Engajamento médio')}><div className="stat-big">{formatPercent(view.avgEngagement)}</div></SectionCard>
            <SectionCard title={tx('Colaboradores em risco alto')}>
              <div className="stat-big">{formatNumber(view.highRisk.length)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>{tx('de')} {view.headcount} {tx('no time')}</p>
            </SectionCard>
          </div>

          <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
            <SectionCard title={tx('Absenteísmo médio')}><div className="stat-big">{formatNumber(view.avgAbsenceDays, 1)}</div><p className="text-secondary" style={{ fontSize: 12 }}>{tx('dias/mês por pessoa')}</p></SectionCard>
            <SectionCard title={tx('Horas extras médias')}><div className="stat-big">{formatNumber(view.avgOvertimeHours, 1)}h</div><p className="text-secondary" style={{ fontSize: 12 }}>{tx('por pessoa/mês')}</p></SectionCard>
            <SectionCard title={tx('Tempo de casa médio')}><div className="stat-big">{formatNumber(view.avgTenureYears, 1)}</div><p className="text-secondary" style={{ fontSize: 12 }}>{tx('anos')}</p></SectionCard>
            <SectionCard title={tx('Talentos críticos')}><div className="stat-big">{formatNumber(view.criticalTalents.length)}</div><p className="text-secondary" style={{ fontSize: 12 }}>{tx('alto desempenho + potencial')}</p></SectionCard>
          </div>

          <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
            <SectionCard title={tx('Desempenho do time')}>
              <BarChart data={view.performanceDistribution} valueKey="count" labelKey="label" formatValue={(v) => formatNumber(v)} />
            </SectionCard>
            <SectionCard title={tx('Risco de saída do time')}>
              <BarChart data={view.riskDistribution} valueKey="count" labelKey="label" color="var(--color-warning)" formatValue={(v) => formatNumber(v)} />
            </SectionCard>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SectionCard title={tx('Nine Box do time')} subtitle={tx('Desempenho x Potencial')}>
              <div className="manager-ninebox">
                {view.nineBoxGrid.map((c, i) => {
                  const intensity = 0.08 + (c.count / maxNineBox) * 0.7;
                  return (
                    <div key={i} className="manager-ninebox-cell" style={{ background: `rgba(${PRIMARY_RGB}, ${intensity})`, color: intensity > 0.45 ? '#fff' : 'var(--color-text)' }}>
                      <span className="manager-ninebox-count">{c.count}</span>
                      <span className="manager-ninebox-caption">{c.performance} / {c.potential}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <SectionCard title={tx('Time')} subtitle={`${view.roster.length} ${tx('colaboradores — ordenado por banco de horas (H. extras)')}`}>
            <Table
              defaultSortKey="recentOvertimeHours"
              defaultSortDir="desc"
              columns={[
                { key: 'name', label: tx('Nome'), render: (r) => <Link to={`/funcionario/${r.id}`}>{r.name}</Link> },
                { key: 'roleLevel', label: tx('Cargo') },
                { key: 'tenureYears', label: tx('Tempo de casa'), render: (r) => `${formatNumber(r.tenureYears, 1)} ${tx('anos')}` },
                { key: 'performanceBucket', label: tx('Desempenho') },
                { key: 'engagementScore', label: tx('Engajamento'), align: 'right', render: (r) => formatPercent(r.engagementScore) },
                { key: 'recentAbsenceDays', label: tx('Faltas (3m)'), align: 'right' },
                {
                  key: 'recentOvertimeHours',
                  label: tx('H. extras (3m)'),
                  align: 'right',
                  cellStyle: (r) => {
                    const ratio = (r.recentOvertimeHours || 0) / maxOvertime;
                    const alpha = 0.1 + ratio * 0.72;
                    return {
                      background: `rgba(${HEAT_RGB}, ${alpha})`,
                      color: alpha > 0.5 ? '#fff' : 'var(--color-text)',
                      fontWeight: 600,
                    };
                  },
                },
                { key: 'risk', label: tx('Risco'), sortAccessor: (r) => r.risk?.score ?? -1, render: (r) => (r.risk ? <span className={`badge badge-${RISK_LEVEL_COLOR[r.risk.level]}`}>{r.risk.level}</span> : '—') },
              ]}
              rows={view.roster}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
