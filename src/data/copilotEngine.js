import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import { diffInYears } from '../utils/dates.js';
import { AREAS } from './constants.js';
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

// Detecta intenção de listar/tabular (com opção de baixar) — inclusive quando o usuário não usa
// a palavra "tabela" (ex.: "funcionários com maior banco de horas", "ranking de...", "top ...").
function wantsTable(q) {
  return has(
    q,
    'tabela', 'em tabela', 'lista', 'listar', 'planilha', 'baixar', 'download', 'exportar', 'excel', 'csv',
    'banco de horas', 'ranking', 'top ', 'quais funcionario', 'quais colaborador',
    'funcionarios com', 'funcionários com', 'colaboradores com', 'quem tem mais', 'quem sao os', 'quem são os',
  );
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

function findArea(q) {
  const found = AREAS.find((a) => q.includes(normalize(a.name)));
  return found ? found.name : null;
}

// Monta a tabela mais adequada ao que foi pedido, com colunas formatadas + dados para download.
function buildTable(q, ctx) {
  const { metrics, risk, medical, safety, hr } = ctx;
  const pct = (v) => formatPercent(v);
  const num = (v) => formatNumber(v);
  const cur = (v) => formatCurrency(v, { compact: true });

  // Ranking de colaboradores por banco de horas extras (soma do período).
  if (has(q, 'banco de horas') || (has(q, 'hora extra', 'horas extras') && has(q, 'funcionario', 'colaborador', 'maior', 'ranking', 'quem', 'mais'))) {
    const ranked = metrics.activeNow.map((e) => {
      let h = 0;
      for (const v of e.monthlyOvertime.values()) h += v;
      return { id: e.id, name: e.name, area: e.area, roleLevel: e.roleLevel, managerName: e.managerName, hours: h };
    }).sort((a, b) => b.hours - a.hours);
    const top = ranked.slice(0, 30);
    return {
      text: `Colaboradores com maior banco de horas extras (soma do período). Mostrando o top 30 — baixe o Excel para todos. Clique no nome para abrir a ficha.`,
      table: {
        title: 'Banco de horas por colaborador',
        columns: [
          { key: 'name', label: 'Nome', href: (r) => `/funcionario/${r.id}` }, { key: 'area', label: 'Diretoria' }, { key: 'roleLevel', label: 'Cargo' },
          { key: 'managerName', label: 'Gestor' }, { key: 'hours', label: 'Banco de horas (h)', align: 'right', render: (r) => num(r.hours) },
        ],
        rows: top,
        exportRows: ranked.map((r) => ({ Nome: r.name, Diretoria: r.area, Cargo: r.roleLevel, Gestor: r.managerName, 'Banco de horas (h)': r.hours })),
        filename: 'banco_de_horas', sheetName: 'Banco de horas',
      },
    };
  }

  // Lista de colaboradores (nome a nome), opcionalmente filtrada por diretoria citada.
  if (has(q, 'funcionario', 'colaborador', 'pessoas', 'nomes', 'quem sao', 'quem são', 'quadro de pessoas')) {
    const area = findArea(q);
    let emps = metrics.activeNow;
    if (area) emps = emps.filter((e) => e.area === area);
    const columns = [
      { key: 'name', label: 'Nome', href: (r) => `/funcionario/${r.id}` },
      { key: 'area', label: 'Diretoria' },
      { key: 'roleLevel', label: 'Cargo' },
      { key: 'managerName', label: 'Gestor' },
      { key: 'unit', label: 'Unidade' },
      { key: 'salary', label: 'Salário', align: 'right', render: (r) => cur(r.salary) },
      { key: 'admissao', label: 'Admissão' },
    ];
    const all = emps.map((e) => ({
      id: e.id, name: e.name, area: e.area, roleLevel: e.roleLevel, managerName: e.managerName,
      unit: e.unit, salary: e.salary, admissao: e.admissionDate.toLocaleDateString('pt-BR'),
    }));
    const display = all.slice(0, 50);
    const exportRows = all.map((r) => ({
      Nome: r.name, Diretoria: r.area, Cargo: r.roleLevel, Gestor: r.managerName,
      Unidade: r.unit, Salário: r.salary, Admissão: r.admissao,
    }));
    return {
      text: `Lista de colaboradores ativos${area ? ` da diretoria **${area}**` : ''} — **${num(all.length)}** no total.${all.length > 50 ? ' Mostrando os primeiros 50; baixe o Excel para a lista completa.' : ''} Clique no nome para abrir a ficha.`,
      table: { title: area ? `Colaboradores · ${area}` : 'Colaboradores ativos', columns, rows: display, exportRows, filename: 'funcionarios', sheetName: 'Funcionários' },
    };
  }

  if (has(q, 'aso', 'exame ocupacional', 'exames') && hr) {
    return tableAnswer('aso_por_tipo', 'ASO', 'ASO por tipo de exame',
      [{ key: 'label', label: 'Tipo' }, { key: 'count', label: 'Exames/mês', align: 'right', render: (r) => num(r.count) }], hr.aso.byType);
  }
  if (has(q, ' epi', 'equipamento de prot') && hr) {
    return tableAnswer('epi_consumo', 'EPI', 'Consumo de EPI por tipo',
      [{ key: 'label', label: 'EPI' }, { key: 'value', label: 'Consumo/mês', align: 'right', render: (r) => num(r.value) }, { key: 'cost', label: 'Custo', align: 'right', render: (r) => cur(r.cost) }], hr.epi.consumo);
  }
  if (has(q, 'nr-', 'nr ', 'norma regulament', ' nrs') && hr) {
    return tableAnswer('treinamentos_nrs', 'NRs', 'Cobertura de treinamentos de NRs',
      [{ key: 'label', label: 'NR' }, { key: 'value', label: 'Cobertura (%)', align: 'right', render: (r) => `${num(r.value)}%` }], hr.nrs.cobertura);
  }
  if (has(q, 'pcd', 'deficien') && hr) {
    return tableAnswer('pcd_por_diretoria', 'PCD', 'PCD por diretoria',
      [{ key: 'area', label: 'Diretoria' }, { key: 'count', label: 'PCD', align: 'right', render: (r) => num(r.count) }, { key: 'pct', label: '%', align: 'right', render: (r) => pct(r.pct) }], hr.pcd.byArea);
  }
  if (has(q, 'aprendiz') && hr) {
    return tableAnswer('jovem_aprendiz', 'Aprendizes', 'Jovem aprendiz por diretoria',
      [{ key: 'area', label: 'Diretoria' }, { key: 'count', label: 'Aprendizes', align: 'right', render: (r) => num(r.count) }], hr.apprentices.byArea);
  }
  if (has(q, 'disciplinar', 'advertenc', 'suspensao', 'justa causa') && hr) {
    return tableAnswer('medidas_disciplinares', 'Disciplinar', 'Medidas disciplinares por motivo',
      [{ key: 'reason', label: 'Motivo' }, { key: 'count', label: 'Ocorrências', align: 'right', render: (r) => num(r.count) }], hr.disciplinary.byReason);
  }
  if (has(q, 'chamado', 'ticket', 'atendimento') && hr) {
    return tableAnswer('chamados_rh', 'Chamados', 'Chamados de RH por categoria',
      [{ key: 'label', label: 'Categoria' }, { key: 'value', label: 'Chamados', align: 'right', render: (r) => num(r.value) }], hr.tickets.byCategory);
  }
  if (has(q, 'trabalhista', 'reclamat', 'processo') && hr) {
    return tableAnswer('trabalhista', 'Trabalhista', 'Processos trabalhistas por motivo',
      [{ key: 'reason', label: 'Motivo' }, { key: 'count', label: 'Processos', align: 'right', render: (r) => num(r.count) }], hr.labor.byReason);
  }
  if (has(q, 'posicionamento', 'compa', 'faixa salarial') && hr) {
    return tableAnswer('posicionamento_salarial', 'Posicionamento', 'Compa-ratio por diretoria',
      [{ key: 'area', label: 'Diretoria' }, { key: 'compa', label: 'Compa-ratio', align: 'right', render: (r) => formatNumber(r.compa, 2) }], hr.positioning.byArea);
  }

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
  // Lista de gestores com tamanho de time (pura, sem métrica associada).
  if (has(q, 'gestor', 'lideranca', 'lider')) {
    const teams = new Map();
    for (const e of metrics.activeNow) {
      if (e.managerName && e.managerName !== 'Diretoria' && e.managerName !== '—') {
        teams.set(e.managerName, (teams.get(e.managerName) ?? 0) + 1);
      }
    }
    const rows = [...teams.entries()].map(([manager, size]) => ({ manager, size })).sort((a, b) => b.size - a.size);
    return tableAnswer('gestores_e_times', 'Gestores', 'Gestores e tamanho do time',
      [{ key: 'manager', label: 'Gestor' }, { key: 'size', label: 'Time (pessoas)', align: 'right', render: (r) => num(r.size) }], rows);
  }
  if (has(q, 'unidade', 'regional', 'filial', 'escritorio')) {
    const units = new Map();
    for (const e of metrics.activeNow) units.set(e.unit, (units.get(e.unit) ?? 0) + 1);
    const rows = [...units.entries()].map(([unit, count]) => ({ unit, count })).sort((a, b) => b.count - a.count);
    return tableAnswer('headcount_por_unidade', 'Unidades', 'Headcount por unidade',
      [{ key: 'unit', label: 'Unidade' }, { key: 'count', label: 'Pessoas', align: 'right', render: (r) => num(r.count) }], rows);
  }
  if (has(q, 'treinamento', 'capacita') && metrics.training?.topTrainings) {
    return tableAnswer('treinamentos', 'Treinamentos', 'Treinamentos mais concluídos',
      [{ key: 'name', label: 'Treinamento' }, { key: 'count', label: 'Concluíram', align: 'right', render: (r) => num(r.count) }], metrics.training.topTrainings);
  }

  // KPIs só quando o usuário pede explicitamente indicadores/painel/resumo. Sem match,
  // retorna null para a pergunta ir para a IA (Gemini) em vez de cair numa tabela genérica.
  if (has(q, 'indicador', 'kpi', 'painel', 'resumo', 'resumão')) {
    return tableAnswer('indicadores_do_mes', 'Indicadores', 'Indicadores do mês',
      [
        { key: 'label', label: 'Indicador' },
        { key: 'valor', label: 'Valor', align: 'right' },
      ], metrics.kpis.map((k) => ({ label: k.label, valor: kpiValue(k) })));
  }
  return null;
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
  const { metrics, forecasts, insights, risk, targets, medical, safety, hr } = ctx;
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

  // Pedido de tabela / lista. Só responde localmente quando há um conjunto de dados
  // correspondente; caso contrário, deixa a pergunta seguir para a IA (Gemini).
  if (wantsTable(q)) {
    const built = buildTable(q, ctx);
    if (built) return built;
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
