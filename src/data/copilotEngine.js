import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import { diffInYears } from '../utils/dates.js';
import { buildExecutiveSummary } from './executiveSummary.js';

const SUGGESTED_PROMPTS = [
  'Qual a relação entre horas extras e turnover?',
  'Quais diretorias apresentam maior risco?',
  'Como está a saúde mental nos atestados?',
  'Resuma os indicadores do mês',
  'Como está a segurança do trabalho?',
  'Monte uma tabela de turnover por diretoria',
];

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function has(text, ...keywords) {
  return keywords.some((k) => text.includes(k));
}

// O usuário pediu explicitamente uma tabela / lista / planilha (com opção de baixar).
function wantsTable(q) {
  return has(q, 'tabela', 'em tabela', 'lista', 'listar', 'planilha', 'baixar', 'download', 'exportar', 'excel', 'csv');
}

function kpiValue(k) {
  if (k.format === 'currency') return formatCurrency(k.value, { compact: true });
  if (k.format === 'percent') return formatPercent(k.value);
  if (k.format === 'days') return `${formatNumber(k.value, 0)} dias`;
  if (k.format === 'years') return `${formatNumber(k.value, 1)} anos`;
  return formatNumber(k.value);
}

function tableAnswer(filename, sheetName, title, columns, rows) {
  return {
    text: `Aqui está a tabela de **${title.toLowerCase()}**. Você pode baixá-la em Excel no botão abaixo.`,
    table: { title, columns, rows, filename, sheetName },
  };
}

// Monta a tabela mais adequada ao que foi pedido, com colunas formatadas + dados para download.
function buildTable(q, ctx) {
  const { metrics, risk, medical, safety } = ctx;
  const pct = (v) => formatPercent(v);
  const num = (v) => formatNumber(v);
  const cur = (v) => formatCurrency(v, { compact: true });

  if (has(q, 'turnover', 'rotativ', 'deslig')) {
    return tableAnswer('turnover_por_diretoria', 'Turnover', 'Turnover por diretoria (12 meses)',
      [
        { key: 'area', label: 'Diretoria' },
        { key: 'count', label: 'Desligamentos', align: 'right', render: (r) => num(r.count) },
        { key: 'rate', label: 'Taxa', align: 'right', render: (r) => pct(r.rate) },
        { key: 'cost', label: 'Custo estimado', align: 'right', render: (r) => cur(r.cost) },
      ], metrics.turnoverByArea);
  }
  if (has(q, 'atestado', 'cid', 'saude mental') && medical) {
    return tableAnswer('atestados_por_cid', 'Atestados', 'Atestados por grupo de CID (12 meses)',
      [
        { key: 'label', label: 'Grupo CID' },
        { key: 'code', label: 'Faixa' },
        { key: 'count', label: 'Atestados', align: 'right', render: (r) => num(r.count) },
        { key: 'days', label: 'Dias perdidos', align: 'right', render: (r) => num(r.days) },
      ], medical.groups);
  }
  if (has(q, 'seguranca', 'paralisac', 'paralisaç', 'acidente', 'inspec') && safety) {
    return tableAnswer('seguranca_paralisacoes', 'Segurança', 'Paralisações por motivo (12 meses)',
      [
        { key: 'label', label: 'Motivo' },
        { key: 'value', label: 'Paralisações', align: 'right', render: (r) => num(r.value) },
      ], safety.stoppagesByReason);
  }
  if (has(q, 'absent', 'falta')) {
    if (has(q, 'gestor')) {
      return tableAnswer('absenteismo_por_gestor', 'Absenteísmo', 'Absenteísmo por gestor (dias)',
        [
          { key: 'manager', label: 'Gestor' },
          { key: 'days', label: 'Dias perdidos', align: 'right', render: (r) => num(r.days) },
        ], metrics.absenteeismByManager);
    }
    return tableAnswer('absenteismo_por_motivo', 'Absenteísmo', 'Absenteísmo por motivo (dias)',
      [
        { key: 'reason', label: 'Motivo' },
        { key: 'days', label: 'Dias perdidos', align: 'right', render: (r) => num(r.days) },
      ], metrics.absenteeismByReason);
  }
  if (has(q, 'hora extra')) {
    return tableAnswer('horas_extras_por_diretoria', 'Horas Extras', 'Custo de horas extras por diretoria',
      [
        { key: 'area', label: 'Diretoria' },
        { key: 'cost', label: 'Custo estimado', align: 'right', render: (r) => cur(r.cost) },
      ], metrics.overtimeByArea);
  }
  if (has(q, 'risco')) {
    return tableAnswer('risco_de_saida', 'Risco', 'Colaboradores com maior risco de saída',
      [
        { key: 'area', label: 'Diretoria' },
        { key: 'managerName', label: 'Gestor' },
        { key: 'score', label: 'Score', align: 'right', render: (r) => num(r.score) },
        { key: 'level', label: 'Nível' },
      ], risk.slice(0, 15));
  }
  if (has(q, 'diversidade', 'genero', 'raca')) {
    return tableAnswer('diversidade_genero', 'Diversidade', 'Distribuição por gênero',
      [
        { key: 'label', label: 'Gênero' },
        { key: 'count', label: 'Pessoas', align: 'right', render: (r) => num(r.count) },
        { key: 'pct', label: '%', align: 'right', render: (r) => pct(r.pct) },
      ], metrics.diversity.gender);
  }
  if (has(q, 'cargo', 'nivel')) {
    return tableAnswer('headcount_por_cargo', 'Cargos', 'Headcount por cargo',
      [
        { key: 'role', label: 'Cargo' },
        { key: 'count', label: 'Pessoas', align: 'right', render: (r) => num(r.count) },
      ], metrics.headcountByRole);
  }
  if (has(q, 'headcount', 'quadro', 'diretoria', 'area', 'colaboradores')) {
    return tableAnswer('headcount_por_diretoria', 'Headcount', 'Headcount por diretoria',
      [
        { key: 'area', label: 'Diretoria' },
        { key: 'count', label: 'Pessoas', align: 'right', render: (r) => num(r.count) },
      ], metrics.headcountByArea);
  }
  // Padrão: painel de indicadores do mês.
  return tableAnswer('indicadores_do_mes', 'Indicadores', 'Indicadores do mês',
    [
      { key: 'label', label: 'Indicador' },
      { key: 'valor', label: 'Valor', align: 'right' },
    ], metrics.kpis.map((k) => ({ label: k.label, valor: kpiValue(k) })));
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
  const { metrics, forecasts, insights, risk, targets, medical, safety } = ctx;
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

  // Pedido explícito de tabela / lista / planilha (com download em Excel).
  if (wantsTable(q)) {
    return buildTable(q, ctx);
  }

  // Correlação turnover × horas extras — cruza as duas métricas por diretoria.
  if (has(q, 'relacao', 'relaç', 'correlac', 'correlaç', 'relacion') && has(q, 'turnover', 'rotativ') && has(q, 'hora extra', 'horas extras')) {
    const otByArea = new Map(metrics.overtimeByArea.map((a) => [a.area, a.cost]));
    const rows = [...metrics.turnoverByArea]
      .map((a) => ({ area: a.area, rate: a.rate, otCost: otByArea.get(a.area) ?? 0 }))
      .sort((x, y) => y.rate - x.rate);
    const top = rows[0];
    return {
      text: `Cruzando as duas métricas por diretoria, **${top.area}** tem o maior turnover (${formatPercent(top.rate)}) e um custo de horas extras de ${formatCurrency(top.otCost, { compact: true })} no período. Em geral, diretorias com mais horas extras (sobrecarga) tendem a mostrar turnover mais alto — é uma associação observada nos dados, não causalidade comprovada.`,
      chart: { type: 'bar', title: 'Turnover por diretoria (12 meses)', data: rows.slice(0, 6), valueKey: 'rate', labelKey: 'area', formatValue: (v) => formatPercent(v) },
      recommendations: [
        `Investigar carga de trabalho e horas extras em ${top.area}, onde turnover e HE aparecem altos juntos.`,
        'Definir um teto de horas extras por equipe e acompanhá-lo como sinal antecipado de risco de saída.',
      ],
    };
  }

  if (has(q, 'atestado', 'cid', 'afastamento', 'saude mental', 'licenca medica')) {
    if (!medical) return { text: 'Os dados de atestados estão disponíveis no dashboard de Atestados.' };
    const k = medical.kpis;
    const topG = medical.groups[0];
    return {
      text: `No último mês foram **${formatNumber(k.atestadosMes)} atestados**, somando ${formatNumber(k.diasMes)} dias perdidos. A saúde mental (CID F) responde por **${formatPercent(k.pctMental)}** dos atestados e ${formatNumber(k.inss15)} afastamentos passaram de 15 dias (encaminhados ao INSS). O grupo de maior volume é **${topG.label}**.`,
      chart: { type: 'bar', title: 'Atestados por grupo de CID (12 meses)', data: medical.groups.slice(0, 6), valueKey: 'count', labelKey: 'label', formatValue: (v) => formatNumber(v) },
      recommendations: [
        'Acompanhar a tendência de saúde mental (CID F), em alta na série mensal.',
        'Identificar as diretorias de maior concentração no mapa do dashboard de Atestados.',
      ],
    };
  }

  if (has(q, 'seguranca', 'acidente', 'paralisac', 'paralisaç', 'inspec', 'sst', ' epi')) {
    if (!safety) return { text: 'Os dados de segurança estão disponíveis no dashboard de Segurança do Trabalho.' };
    const k = safety.kpis;
    const topR = safety.stoppagesByReason[0];
    return {
      text: `Estamos há **${formatNumber(k.daysWithoutAccident)} dias sem acidente** com afastamento. A taxa de frequência (TF) é ${formatNumber(k.tf, 1)} e a de gravidade (TG) ${formatNumber(k.tg)}. Foram **${formatNumber(k.paralisacoes12)} paralisações** em 12 meses, sendo o principal motivo "${topR?.label}". A conformidade das inspeções está em ${formatPercent(k.conformidade)}.`,
      chart: { type: 'bar', title: 'Paralisações por motivo (12 meses)', data: safety.stoppagesByReason, valueKey: 'value', labelKey: 'label', formatValue: (v) => formatNumber(v) },
      recommendations: [
        `Priorizar o controle de "${topR?.label}", principal causa de paralisação.`,
        'Reforçar inspeções nas diretorias de maior concentração de acidentes.',
      ],
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
