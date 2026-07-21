import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import { diffInYears } from '../utils/dates.js';
import { buildExecutiveSummary } from './executiveSummary.js';

const SUGGESTED_PROMPTS = [
  'Por que o turnover aumentou?',
  'Quais diretorias apresentam maior risco?',
  'Qual gestor possui maior absenteísmo?',
  'Resuma os indicadores do mês',
  'Crie um relatório executivo',
  'Quanto custa o turnover hoje?',
];

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function has(text, ...keywords) {
  return keywords.some((k) => text.includes(k));
}

// A chart earns its place only when the question actually asks for a breakdown/ranking/
// comparison — a single-fact question ("qual é o headcount total?") reads better as just
// a number in the text than as a bar chart the user didn't ask to see.
function wantsBreakdown(q) {
  return has(
    q,
    'por area', 'por diretoria', 'por gestor', 'por unidade', 'por regiao', 'por região',
    'distribui', 'ranking', 'quais area', 'quais diretoria', 'cada area', 'cada diretoria',
    'comparar', 'comparaç', 'onde estao', 'onde estão', 'top ', 'maiores', 'menores', 'motivo',
  );
}

// Looks for a specific colleague named in the question (needs >=2 matching name tokens to
// avoid one common first name accidentally matching the wrong person).
function findEmployeeMention(q, activeNow) {
  const qTokens = new Set(q.split(/\s+/).filter((t) => t.length > 2));
  let best = null;
  let bestScore = 0;
  for (const e of activeNow) {
    const nameTokens = normalize(e.name).split(/\s+/).filter((t) => t.length > 2);
    const matches = nameTokens.filter((t) => qTokens.has(t)).length;
    if (matches >= 2 && matches > bestScore) {
      bestScore = matches;
      best = e;
    }
  }
  return best;
}

export function answerQuestion(question, ctx) {
  const { metrics, forecasts, insights, risk, targets } = ctx;
  const q = normalize(question);
  const last = (arr) => arr[arr.length - 1];
  const prev = (arr) => arr[arr.length - 2];

  const mentionedEmployee = findEmployeeMention(q, metrics.activeNow);
  if (mentionedEmployee) {
    const riskEntry = risk.find((r) => r.id === mentionedEmployee.id);
    return {
      text: `Encontrei **${mentionedEmployee.name}** no quadro atual — aqui está o resumo:`,
      employeeCard: {
        id: mentionedEmployee.id,
        name: mentionedEmployee.name,
        roleLevel: mentionedEmployee.roleLevel,
        area: mentionedEmployee.area,
        managerName: mentionedEmployee.managerName,
        tenureYears: diffInYears(mentionedEmployee.admissionDate, metrics.referenceDate),
        performanceBucket: mentionedEmployee.performanceBucket,
        potential: mentionedEmployee.potential,
        engagementScore: mentionedEmployee.engagementScore,
        risk: riskEntry ? { score: riskEntry.score, level: riskEntry.level } : null,
      },
    };
  }

  if (has(q, 'turnover', 'rotativ')) {
    const turn = last(metrics.turnoverSeries);
    const turnPrev = prev(metrics.turnoverSeries);
    const topArea = [...metrics.turnoverByArea].sort((a, b) => b.rate - a.rate)[0];
    const last12Cost = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0);
    return {
      text: `O turnover do último mês fechado foi de ${formatPercent(turn.totalRate)}, contra ${formatPercent(turnPrev.totalRate)} no mês anterior (${turn.totalRate >= turnPrev.totalRate ? 'alta' : 'queda'} de ${formatNumber(Math.abs(turn.totalRate - turnPrev.totalRate), 2)} p.p.). A diretoria com maior taxa nos últimos 12 meses é **${topArea.area}**, com ${formatPercent(topArea.rate)}.`,
      chart: { type: 'bar', title: 'Turnover por diretoria (12 meses)', data: metrics.turnoverByArea.slice(0, 6), valueKey: 'rate', labelKey: 'area', formatValue: (v) => formatPercent(v) },
      financialImpact: `Custo estimado do turnover nos últimos 12 meses: ${formatCurrency(last12Cost, { compact: true })} (reposição, ramp-up e perda de produtividade).`,
      recommendations: [
        `Priorizar ação de retenção em ${topArea.area}, a diretoria com maior taxa de saída.`,
        'Revisar motivos de desligamento voluntário mais recorrentes com os gestores da diretoria.',
        'Acompanhar o forecast de turnover dos próximos 3 meses para antecipar picos.',
      ],
    };
  }

  if (has(q, 'risco') && (has(q, 'area', 'areas') || !has(q, 'gestor', 'colaborador'))) {
    const byArea = new Map();
    for (const r of risk) {
      if (!byArea.has(r.area)) byArea.set(r.area, []);
      byArea.get(r.area).push(r.score);
    }
    const ranked = [...byArea.entries()]
      .map(([area, scores]) => ({ area, avgScore: scores.reduce((a, b) => a + b, 0) / scores.length, highCount: scores.filter((s) => s >= 55).length }))
      .sort((a, b) => b.avgScore - a.avgScore);
    const top = ranked[0];
    return {
      text: `Analisando o modelo de risco de saída por colaborador, a diretoria **${top.area}** apresenta o maior risco médio (score ${formatNumber(top.avgScore, 0)}/100), com ${top.highCount} colaboradores classificados como "Alto" ou "Muito Alto" risco.`,
      chart: { type: 'bar', title: 'Score médio de risco por diretoria', data: ranked.slice(0, 6), valueKey: 'avgScore', labelKey: 'area', formatValue: (v) => formatNumber(v, 0) },
      recommendations: [
        `Priorizar conversas 1:1 e planos de desenvolvimento individual em ${top.area}.`,
        'Revisar equidade salarial frente à mediana da diretoria para colaboradores de alto risco.',
        'Monitorar engajamento e horas extras recorrentes como sinais de alerta antecipado.',
      ],
    };
  }

  if (has(q, 'gestor') && has(q, 'absent', 'falta')) {
    const top = metrics.absenteeismByManager[0];
    return {
      text: `O gestor com maior volume de absenteísmo em sua equipe nos últimos 24 meses é **${top?.manager}**, com ${formatNumber(top?.days ?? 0)} dias perdidos acumulados.`,
      chart: { type: 'bar', title: 'Absenteísmo por gestor (dias)', data: metrics.absenteeismByManager, valueKey: 'days', labelKey: 'manager', formatValue: (v) => formatNumber(v) },
      recommendations: [
        'Investigar causas específicas do time — atestados recorrentes podem indicar sobrecarga ou clima organizacional.',
        'Comparar com o índice médio da unidade para verificar se é um caso isolado ou padrão de diretoria.',
      ],
    };
  }

  if (has(q, 'resum', 'indicadores do mes', 'como estamos')) {
    return {
      text: `Resumo executivo do período fechado em ${metrics.labels[metrics.labels.length - 1]}: headcount de ${formatNumber(metrics.activeNow.length)} colaboradores, turnover de ${formatPercent(last(metrics.turnoverSeries).totalRate)} e absenteísmo de ${formatPercent(last(metrics.absenteeismSeries).rate)}. A folha de pagamento soma ${formatCurrency(last(metrics.payrollSeries).total, { compact: true })}/mês. A tabela abaixo compara cada indicador com o mês anterior e com a meta, quando há orçamento definido.`,
      execSummary: buildExecutiveSummary(metrics, targets),
      recommendations: insights.slice(0, 3).map((i) => i.title),
    };
  }

  if (has(q, 'relatorio executivo', 'crie um relatorio', 'gerar relatorio')) {
    return {
      text: `Relatório executivo gerado com base nos dados atuais. Principais destaques do período:\n\n${insights.slice(0, 4).map((i) => `• ${i.title}`).join('\n')}\n\nO relatório completo em PDF/PowerPoint pode ser baixado na página **Relatórios**.`,
      recommendations: ['Acessar a página Relatórios para exportar a versão formatada em PDF ou PowerPoint.'],
    };
  }

  if (has(q, 'custo', 'quanto custa')) {
    const last12Cost = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0);
    const otCost = metrics.overtimeSeries.slice(-12).reduce((s, o) => s + o.cost, 0);
    return {
      text: `Nos últimos 12 meses, o turnover custou aproximadamente ${formatCurrency(last12Cost, { compact: true })} e as horas extras somaram ${formatCurrency(otCost, { compact: true })} em custo adicional à folha.`,
      financialImpact: `Custo total combinado: ${formatCurrency(last12Cost + otCost, { compact: true })}.`,
    };
  }

  if (has(q, 'grafico', 'explique esse')) {
    return {
      text: 'Os gráficos deste painel usam sempre a mesma leitura: o eixo de valor representa a métrica selecionada (ex.: taxa, dias, horas ou custo) e as barras/linhas comparam períodos ou recortes (diretoria, gestor, unidade). Cores mais intensas em mapas de calor indicam valores mais altos. Se quiser, pergunte sobre um indicador específico (ex.: "explique o turnover da diretoria Comercial") que eu detalho os números por trás dele.',
    };
  }

  if (has(q, 'absenteismo', 'falta')) {
    const last12 = metrics.absenteeismSeries.slice(-12).reduce((s, a) => s + a.totalDays, 0);
    const breakdown = wantsBreakdown(q);
    return {
      text: `O índice de absenteísmo do último mês fechado é ${formatPercent(last(metrics.absenteeismSeries).rate)}, totalizando ${formatNumber(last12)} dias perdidos nos últimos 12 meses.${breakdown ? ` O principal motivo registrado é "${metrics.absenteeismByReason[0]?.reason}".` : ''}`,
      chart: breakdown ? { type: 'bar', title: 'Motivos de absenteísmo', data: metrics.absenteeismByReason, valueKey: 'days', labelKey: 'reason', formatValue: (v) => formatNumber(v) } : undefined,
    };
  }

  if (has(q, 'headcount', 'quadro', 'colaboradores')) {
    const breakdown = wantsBreakdown(q);
    return {
      text: `O headcount ativo atual é de ${formatNumber(metrics.activeNow.length)} colaboradores${breakdown ? `, distribuídos principalmente em ${metrics.headcountByArea[0].area} (${formatNumber(metrics.headcountByArea[0].count)}) e ${metrics.headcountByArea[1].area} (${formatNumber(metrics.headcountByArea[1].count)})` : ''}.`,
      chart: breakdown ? { type: 'bar', title: 'Headcount por diretoria', data: metrics.headcountByArea, valueKey: 'count', labelKey: 'area', formatValue: (v) => formatNumber(v) } : undefined,
    };
  }

  if (has(q, 'horas extras', 'hora extra')) {
    const last12 = metrics.overtimeSeries.slice(-12).reduce((s, o) => s + o.cost, 0);
    const breakdown = wantsBreakdown(q);
    return {
      text: `O custo de horas extras nos últimos 12 meses somou ${formatCurrency(last12, { compact: true })}${breakdown ? `, com a diretoria ${metrics.overtimeByArea[0]?.area} concentrando o maior volume` : ''}.`,
      chart: breakdown ? { type: 'bar', title: 'Custo de horas extras por diretoria', data: metrics.overtimeByArea, valueKey: 'cost', labelKey: 'area', formatValue: (v) => formatCurrency(v, { compact: true }) } : undefined,
    };
  }

  if (has(q, 'diversidade', 'genero', 'mulheres', 'raca')) {
    const women = metrics.diversity.gender.find((g) => g.label === 'Feminino')?.pct ?? 0;
    const womenLead = metrics.diversity.leadershipGender.find((g) => g.label === 'Feminino')?.pct ?? 0;
    return {
      text: `Mulheres representam ${formatPercent(women)} do quadro total e ${formatPercent(womenLead)} das posições de liderança. O quadro de PCD é de ${formatPercent(metrics.diversity.pcdPct)}.`,
      chart: { type: 'bar', title: 'Distribuição por gênero', data: metrics.diversity.gender, valueKey: 'pct', labelKey: 'label', formatValue: (v) => formatPercent(v) },
    };
  }

  if (has(q, 'treinamento', 'capacitacao')) {
    return {
      text: `Foram registradas ${formatNumber(metrics.training.hoursTotal)} horas de treinamento no ano, com ${formatPercent(metrics.training.participationPct)} de participação e ROI estimado de R$ ${formatNumber(metrics.training.roiRatio, 2)} para cada real investido.`,
    };
  }

  return {
    text: `Não encontrei uma métrica específica para essa pergunta ainda. Tente perguntar sobre: turnover, absenteísmo, headcount, custo de pessoal, horas extras, diversidade, treinamentos ou risco de saída — eu respondo com base nos dados atuais da plataforma.`,
  };
}

export { SUGGESTED_PROMPTS };
