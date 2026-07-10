import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

const SUGGESTED_PROMPTS = [
  'Por que o turnover aumentou?',
  'Quais áreas apresentam maior risco?',
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

export function answerQuestion(question, ctx) {
  const { metrics, forecasts, insights, risk } = ctx;
  const q = normalize(question);
  const last = (arr) => arr[arr.length - 1];
  const prev = (arr) => arr[arr.length - 2];

  if (has(q, 'turnover', 'rotativ')) {
    const turn = last(metrics.turnoverSeries);
    const turnPrev = prev(metrics.turnoverSeries);
    const topArea = [...metrics.turnoverByArea].sort((a, b) => b.rate - a.rate)[0];
    const last12Cost = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0);
    return {
      text: `O turnover do último mês fechado foi de ${formatPercent(turn.totalRate)}, contra ${formatPercent(turnPrev.totalRate)} no mês anterior (${turn.totalRate >= turnPrev.totalRate ? 'alta' : 'queda'} de ${formatNumber(Math.abs(turn.totalRate - turnPrev.totalRate), 2)} p.p.). A área com maior taxa nos últimos 12 meses é **${topArea.area}**, com ${formatPercent(topArea.rate)}.`,
      chart: { type: 'bar', title: 'Turnover por área (12 meses)', data: metrics.turnoverByArea.slice(0, 6), valueKey: 'rate', labelKey: 'area', formatValue: (v) => formatPercent(v) },
      financialImpact: `Custo estimado do turnover nos últimos 12 meses: ${formatCurrency(last12Cost, { compact: true })} (reposição, ramp-up e perda de produtividade).`,
      recommendations: [
        `Priorizar ação de retenção em ${topArea.area}, a área com maior taxa de saída.`,
        'Revisar motivos de desligamento voluntário mais recorrentes com os gestores da área.',
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
      text: `Analisando o modelo de risco de saída por colaborador, a área **${top.area}** apresenta o maior risco médio (score ${formatNumber(top.avgScore, 0)}/100), com ${top.highCount} colaboradores classificados como "Alto" ou "Muito Alto" risco.`,
      chart: { type: 'bar', title: 'Score médio de risco por área', data: ranked.slice(0, 6), valueKey: 'avgScore', labelKey: 'area', formatValue: (v) => formatNumber(v, 0) },
      recommendations: [
        `Priorizar conversas 1:1 e planos de desenvolvimento individual em ${top.area}.`,
        'Revisar equidade salarial frente à mediana da área para colaboradores de alto risco.',
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
        'Comparar com o índice médio da unidade para verificar se é um caso isolado ou padrão de área.',
      ],
    };
  }

  if (has(q, 'resum', 'indicadores do mes', 'como estamos')) {
    const rows = metrics.kpis.map((k) => ({ Indicador: k.label, Valor: k.value, Variação: k.delta }));
    return {
      text: `Resumo executivo do período fechado em ${metrics.labels[metrics.labels.length - 1]}: headcount de ${formatNumber(metrics.activeNow.length)} colaboradores, turnover de ${formatPercent(last(metrics.turnoverSeries).totalRate)} e absenteísmo de ${formatPercent(last(metrics.absenteeismSeries).rate)}. A folha de pagamento soma ${formatCurrency(last(metrics.payrollSeries).total, { compact: true })}/mês.`,
      table: {
        columns: [{ key: 'Indicador', label: 'Indicador' }, { key: 'ValorFmt', label: 'Valor' }],
        rows: metrics.kpis.map((k) => ({ Indicador: k.label, ValorFmt: formatKpiValue(k) })),
      },
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
      text: 'Os gráficos deste painel usam sempre a mesma leitura: o eixo de valor representa a métrica selecionada (ex.: taxa, dias, horas ou custo) e as barras/linhas comparam períodos ou recortes (área, gestor, unidade). Cores mais intensas em mapas de calor indicam valores mais altos. Se quiser, pergunte sobre um indicador específico (ex.: "explique o turnover da área Comercial") que eu detalho os números por trás dele.',
    };
  }

  if (has(q, 'absenteismo', 'falta')) {
    const last12 = metrics.absenteeismSeries.slice(-12).reduce((s, a) => s + a.totalDays, 0);
    return {
      text: `O índice de absenteísmo do último mês fechado é ${formatPercent(last(metrics.absenteeismSeries).rate)}, totalizando ${formatNumber(last12)} dias perdidos nos últimos 12 meses. O principal motivo registrado é "${metrics.absenteeismByReason[0]?.reason}".`,
      chart: { type: 'bar', title: 'Motivos de absenteísmo', data: metrics.absenteeismByReason, valueKey: 'days', labelKey: 'reason', formatValue: (v) => formatNumber(v) },
    };
  }

  if (has(q, 'headcount', 'quadro', 'colaboradores')) {
    return {
      text: `O headcount ativo atual é de ${formatNumber(metrics.activeNow.length)} colaboradores, distribuídos principalmente em ${metrics.headcountByArea[0].area} (${formatNumber(metrics.headcountByArea[0].count)}) e ${metrics.headcountByArea[1].area} (${formatNumber(metrics.headcountByArea[1].count)}).`,
      chart: { type: 'bar', title: 'Headcount por área', data: metrics.headcountByArea, valueKey: 'count', labelKey: 'area', formatValue: (v) => formatNumber(v) },
    };
  }

  if (has(q, 'horas extras', 'hora extra')) {
    const last12 = metrics.overtimeSeries.slice(-12).reduce((s, o) => s + o.cost, 0);
    return {
      text: `O custo de horas extras nos últimos 12 meses somou ${formatCurrency(last12, { compact: true })}, com a área ${metrics.overtimeByArea[0]?.area} concentrando o maior volume.`,
      chart: { type: 'bar', title: 'Custo de horas extras por área', data: metrics.overtimeByArea, valueKey: 'cost', labelKey: 'area', formatValue: (v) => formatCurrency(v, { compact: true }) },
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

function formatKpiValue(kpi) {
  if (kpi.format === 'currency') return formatCurrency(kpi.value, { compact: true });
  if (kpi.format === 'percent') return formatPercent(kpi.value);
  if (kpi.format === 'days') return `${formatNumber(kpi.value, 0)} dias`;
  if (kpi.format === 'years') return `${formatNumber(kpi.value, 1)} anos`;
  return formatNumber(kpi.value);
}

export { SUGGESTED_PROMPTS };
