import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import { exportSheet, exportWorkbook } from '../utils/exportExcel.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import './Reports.css';

function buildReportDefinitions(metrics) {
  return [
    {
      id: 'colaboradores',
      title: 'Colaboradores ativos',
      description: 'Quadro completo com diretoria, cargo, gestor, salário e admissão',
      rows: () => metrics.activeNow.map((e) => ({
        Nome: e.name, Diretoria: e.area, Cargo: e.roleLevel, Gestor: e.managerName, Unidade: e.unit,
        Admissão: e.admissionDate.toLocaleDateString('pt-BR'), Salário: e.salary, Gênero: e.gender, Raça: e.race,
      })),
    },
    {
      id: 'desligamentos',
      title: 'Desligamentos (12 meses)',
      description: 'Todos os desligamentos com tipo, motivo e custo estimado',
      // rows() is replaced below — needs the raw employee list, not just aggregated metrics.
      rows: () => [],
    },
    {
      id: 'turnover-area',
      title: 'Turnover por diretoria',
      description: 'Taxa, volume e custo de rotatividade nos últimos 12 meses',
      rows: () => metrics.turnoverByArea.map((a) => ({
        Diretoria: a.area, Desligamentos: a.count, 'Taxa (%)': a.rate.toFixed(2), 'Custo estimado (R$)': a.cost.toFixed(2),
      })),
    },
    {
      id: 'absenteismo-gestor',
      title: 'Absenteísmo por gestor',
      description: 'Dias perdidos acumulados por gestor nos últimos 24 meses',
      rows: () => metrics.absenteeismByManager.map((m) => ({ Gestor: m.manager, 'Dias perdidos': m.days })),
    },
    {
      id: 'horas-extras',
      title: 'Horas extras por diretoria',
      description: 'Custo acumulado de horas extras por diretoria nos últimos 24 meses',
      rows: () => metrics.overtimeByArea.map((a) => ({ Diretoria: a.area, 'Custo estimado (R$)': a.cost.toFixed(2) })),
    },
    {
      id: 'talentos',
      title: 'Talentos críticos',
      description: 'Colaboradores com alto desempenho e alto potencial (nine box)',
      rows: () => metrics.criticalTalents.map((t) => ({
        Nome: t.name, Diretoria: t.area, Cargo: t.roleLevel, Gestor: t.managerName, Engajamento: t.engagementScore,
      })),
    },
  ];
}

const SUMMARY_AUDIENCES = [
  { id: 'diretoria', label: 'Resumo para Diretoria', focus: 'financeiro e estratégico' },
  { id: 'rh', label: 'Resumo para RH', focus: 'operacional e indicadores completos' },
  { id: 'gestores', label: 'Resumo para Gestores', focus: 'time, absenteísmo e horas extras' },
];

function buildSummaryText(audience, metrics, insights) {
  const last = (arr) => arr[arr.length - 1];
  const header = `${audience.label.toUpperCase()}\nPeople Analytics Copilot — período fechado em ${metrics.labels.at(-1)}\n${'='.repeat(60)}\n\n`;
  const kpiLines = metrics.kpis.map((k) => `- ${k.label}: ${formatKpi(k)}`).join('\n');
  const insightLines = insights.map((i) => `- ${i.title}`).join('\n');
  return `${header}INDICADORES PRINCIPAIS\n${kpiLines}\n\nINSIGHTS DO PERÍODO\n${insightLines}\n\nFoco sugerido para este público: ${audience.focus}.\n`;
}

function formatKpi(k) {
  if (k.format === 'currency') return formatCurrency(k.value, { compact: true });
  if (k.format === 'percent') return formatPercent(k.value);
  if (k.format === 'days') return `${formatNumber(k.value, 0)} dias`;
  if (k.format === 'years') return `${formatNumber(k.value, 1)} anos`;
  return formatNumber(k.value);
}

function openPrintableSummary(title, text) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, 'Segoe UI', sans-serif; padding: 48px; color: #0F172A; white-space: pre-wrap; line-height: 1.7; }
          h1 { font-size: 18px; }
        </style>
      </head>
      <body>${text.replace(/</g, '&lt;')}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export default function Reports() {
  const { metrics, employees, insights } = useData();
  const [busyAll, setBusyAll] = useState(false);
  const reports = buildReportDefinitions(metrics).map((r) => {
    if (r.id === 'desligamentos') {
      return {
        ...r,
        rows: () => employees.filter((e) => e.status === 'Desligado' && e.terminationDate >= metrics.months.at(-12)).map((e) => ({
          Nome: e.name, Diretoria: e.area, Cargo: e.roleLevel, Tipo: e.terminationType, Motivo: e.terminationReason,
          Admissão: e.admissionDate.toLocaleDateString('pt-BR'), Desligamento: e.terminationDate.toLocaleDateString('pt-BR'),
          'Custo estimado (R$)': (e.salary * 12 * 0.6).toFixed(2),
        })),
      };
    }
    return r;
  });

  async function handleExportAll() {
    setBusyAll(true);
    try {
      await exportWorkbook('people_analytics_relatorios', reports.map((r) => ({ name: r.title, rows: r.rows() })));
    } finally {
      setBusyAll(false);
    }
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p className="page-subtitle">Exporte recortes prontos em Excel ou gere resumos executivos por público</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleExportAll} disabled={busyAll}>
          {busyAll ? 'Gerando…' : 'Exportar tudo (.xlsx)'}
        </button>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 28 }}>
        {reports.map((r) => {
          const rowCount = r.rows().length;
          return (
            <SectionCard key={r.id} title={r.title} subtitle={r.description}>
              <div className="report-card-footer">
                <span className="text-tertiary" style={{ fontSize: 11.5 }}>{formatNumber(rowCount)} linhas disponíveis</span>
                <button type="button" className="btn btn-sm" onClick={() => exportSheet(r.id, r.title, r.rows())}>Exportar Excel</button>
              </div>
            </SectionCard>
          );
        })}
      </div>

      <div className="section-title"><span>Resumos executivos (gerados por IA)</span></div>
      <div className="grid grid-cols-3">
        {SUMMARY_AUDIENCES.map((audience) => (
          <SectionCard key={audience.id} title={audience.label} subtitle={`Foco: ${audience.focus}`}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => openPrintableSummary(audience.label, buildSummaryText(audience, metrics, insights))}
            >
              Gerar resumo (PDF/impressão)
            </button>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
