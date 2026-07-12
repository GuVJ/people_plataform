import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import Table from '../components/ui/Table.jsx';
import AIInsightPanel from '../components/profile/AIInsightPanel.jsx';
import { RISK_LEVEL_COLOR } from '../data/risk.js';
import { buildManagerView } from '../data/managerView.js';
import { buildLocalManagerInsight, buildManagerCopilotContext } from '../data/managerInsight.js';
import { formatNumber, formatPercent } from '../utils/format.js';
import { PRIMARY_RGB } from '../utils/colors.js';
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

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Visão do Gestor</h1>
          <p className="page-subtitle">Indicadores do time — escopo restrito aos reportes diretos do gestor selecionado</p>
        </div>
        <select className="manager-select" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.area}</option>)}
        </select>
      </div>

      <div className="card manager-header">
        <span className="manager-avatar">{initials(view.manager.name)}</span>
        <div>
          <Link to={`/funcionario/${view.manager.id}`} className="manager-header-name">{view.manager.name}</Link>
          <p className="text-secondary" style={{ fontSize: 12.5, marginTop: 2 }}>{view.manager.roleLevel} · {view.manager.area} · {view.headcount} reporte{view.headcount !== 1 ? 's' : ''} diretos</p>
        </div>
      </div>

      {view.headcount === 0 ? (
        <SectionCard><p className="text-secondary">Este gestor ainda não possui reportes diretos ativos.</p></SectionCard>
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
            <SectionCard title="Headcount do time"><div className="stat-big">{formatNumber(view.headcount)}</div></SectionCard>
            <SectionCard title="Turnover do time (12m)"><div className="stat-big">{formatPercent(view.turnoverRate)}</div></SectionCard>
            <SectionCard title="Engajamento médio"><div className="stat-big">{formatPercent(view.avgEngagement)}</div></SectionCard>
            <SectionCard title="Colaboradores em risco alto">
              <div className="stat-big">{formatNumber(view.highRisk.length)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>de {view.headcount} no time</p>
            </SectionCard>
          </div>

          <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
            <SectionCard title="Absenteísmo médio"><div className="stat-big">{formatNumber(view.avgAbsenceDays, 1)}</div><p className="text-secondary" style={{ fontSize: 12 }}>dias/mês por pessoa</p></SectionCard>
            <SectionCard title="Horas extras médias"><div className="stat-big">{formatNumber(view.avgOvertimeHours, 1)}h</div><p className="text-secondary" style={{ fontSize: 12 }}>por pessoa/mês</p></SectionCard>
            <SectionCard title="Tempo de casa médio"><div className="stat-big">{formatNumber(view.avgTenureYears, 1)}</div><p className="text-secondary" style={{ fontSize: 12 }}>anos</p></SectionCard>
            <SectionCard title="Talentos críticos"><div className="stat-big">{formatNumber(view.criticalTalents.length)}</div><p className="text-secondary" style={{ fontSize: 12 }}>alto desempenho + potencial</p></SectionCard>
          </div>

          <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
            <SectionCard title="Desempenho do time">
              <BarChart data={view.performanceDistribution} valueKey="count" labelKey="label" formatValue={(v) => formatNumber(v)} />
            </SectionCard>
            <SectionCard title="Risco de saída do time">
              <BarChart data={view.riskDistribution} valueKey="count" labelKey="label" color="var(--color-warning)" formatValue={(v) => formatNumber(v)} />
            </SectionCard>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SectionCard title="Nine Box do time" subtitle="Desempenho x Potencial">
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

          <SectionCard title="Time" subtitle={`${view.roster.length} colaboradores — ordenado por risco de saída`}>
            <Table
              columns={[
                { key: 'name', label: 'Nome', render: (r) => <Link to={`/funcionario/${r.id}`}>{r.name}</Link> },
                { key: 'roleLevel', label: 'Cargo' },
                { key: 'tenureYears', label: 'Tempo de casa', render: (r) => `${formatNumber(r.tenureYears, 1)} anos` },
                { key: 'performanceBucket', label: 'Desempenho' },
                { key: 'engagementScore', label: 'Engajamento', align: 'right', render: (r) => formatPercent(r.engagementScore) },
                { key: 'recentAbsenceDays', label: 'Faltas (3m)', align: 'right' },
                { key: 'recentOvertimeHours', label: 'H. extras (3m)', align: 'right' },
                { key: 'risk', label: 'Risco', sortAccessor: (r) => r.risk?.score ?? -1, render: (r) => (r.risk ? <span className={`badge badge-${RISK_LEVEL_COLOR[r.risk.level]}`}>{r.risk.level}</span> : '—') },
              ]}
              rows={view.roster}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
