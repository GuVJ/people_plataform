import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import { diffInYears } from '../utils/dates.js';
import { AREAS } from './constants.js';
import { buildExecutiveSummary } from './executiveSummary.js';
import { pick, txt } from '../i18n/lang.js';

// Prompts sugeridos: são reenviados como a pergunta do usuário e reprocessados pelo
// matcher (has/normalize), que é baseado em palavras-chave PT. Mantê-los em PT preserva
// o funcionamento do copiloto; a resposta gerada já é traduzida via pick()/txt().
const SUGGESTED_PROMPTS = [
  'Qual a relação entre horas extras e turnover?',
  'Quais diretorias apresentam maior risco?',
  'Como está a saúde mental nos atestados?',
  'Resuma os indicadores do mês',
  'Como está a segurança do trabalho?',
  'A linha vai bater a meta de produção hoje?',
];

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function has(text, ...keywords) {
  return keywords.some((k) => text.includes(k));
}

// Mapa tema → página de indicadores. Ordenado do mais específico para o mais genérico
// (o primeiro match vence). Usado para oferecer um botão "ir para a página" na resposta.
const PAGE_MAP = [
  { kws: ['posicionamento', 'compa', 'faixa salarial'], to: '/posicionamento', label: 'Posicionamento Salarial' },
  { kws: ['pcd', 'deficien', 'cota de pcd'], to: '/pcd', label: 'PCD' },
  { kws: ['aprendiz'], to: '/aprendizes', label: 'Jovem Aprendiz' },
  { kws: ['disciplinar', 'advertenc', 'suspensao', 'justa causa'], to: '/disciplinar', label: 'Medidas Disciplinares' },
  { kws: ['chamado', 'ticket', 'atendimento de rh'], to: '/chamados', label: 'Chamados de RH' },
  { kws: ['trabalhista', 'reclamat', 'processo'], to: '/trabalhista', label: 'Trabalhista' },
  { kws: [/\basos?\b/, 'exame ocupacional'], to: '/aso', label: 'ASO' },
  { kws: [/\bepis?\b/, 'equipamento de prot'], to: '/epi', label: 'EPI' },
  { kws: [/\bnrs?\b/, /\bnr-?\d/, 'norma regulament'], to: '/nrs', label: 'NRs' },
  { kws: ['atestado', 'cid', 'afastamento', 'saude mental', 'licenca medica'], to: '/atestados', label: 'Atestados' },
  { kws: ['seguranca', 'acidente', 'paralisac', 'inspec', 'sst'], to: '/seguranca', label: 'Segurança do Trabalho' },
  { kws: ['produtividade', 'linha de montagem', 'gargalo', 'takt', 'oee', 'estacao', 'chao de fabrica', 'veiculos/dia'], to: '/produtividade', label: 'Produtividade da Linha' },
  { kws: ['risco de saida', 'preditivo', 'attrition', 'previsao de saida'], to: '/predictions', label: 'Preditivo de Saída' },
  { kws: ['turnover', 'rotativ', 'deslig'], to: '/turnover', label: 'Turnover' },
  { kws: ['absent', 'falta'], to: '/absenteeism', label: 'Absenteísmo' },
  { kws: ['hora extra', 'horas extras', 'banco de horas'], to: '/overtime', label: 'Horas Extras' },
  { kws: ['recrutamento', 'contratac', 'admiss', 'funil'], to: '/recruitment', label: 'Recrutamento' },
  { kws: ['diversidade', 'genero', 'raca', 'mulheres'], to: '/diversity', label: 'Diversidade' },
  { kws: ['treinamento', 'capacita'], to: '/training', label: 'Treinamentos' },
  { kws: ['desempenho', 'nine box', 'nine-box', 'potencial', 'talento'], to: '/performance', label: 'Desempenho' },
  { kws: ['orcamento', 'custo de pessoal', 'custo de pessoas', 'folha de pagamento'], to: '/orcamento', label: 'Orçamento' },
  { kws: ['organograma'], to: '/organograma', label: 'Organograma' },
  { kws: ['visao do gestor', 'por gestor', 'time do gestor'], to: '/gestor', label: 'Visão do Gestor' },
  { kws: ['relatorio', 'exportar em excel', 'baixar em excel'], to: '/reports', label: 'Relatórios' },
  { kws: ['headcount', 'quadro', 'forca de trabalho', 'workforce', 'cargo'], to: '/workforce', label: 'Workforce' },
];

// Descobre a página de indicadores relacionada à pergunta (ou null). Recebe a pergunta crua.
export function pageForQuestion(question) {
  const q = normalize(question);
  for (const p of PAGE_MAP) {
    // kws pode ser string (substring) ou RegExp (para termos curtos como "epi", "aso", "nr").
    if (p.kws.some((k) => (k instanceof RegExp ? k.test(q) : q.includes(k)))) {
      return { to: p.to, label: p.label };
    }
  }
  return null;
}

// Detecta intenção de listar/tabular (com opção de baixar) — inclusive quando o usuário não usa
// a palavra "tabela" (ex.: "funcionários com maior banco de horas", "ranking de...", "top ...").
function wantsTable(q) {
  return has(
    q,
    'tabela', 'em tabela', 'lista', 'listar', 'planilha', 'baixar', 'download', 'exportar', 'excel', 'csv',
    'banco de horas', 'ranking', 'top ', 'quais funcionario', 'quais colaborador',
    'funcionarios com', 'funcionários com', 'colaboradores com', 'quem tem mais', 'quem sao os', 'quem são os',
    'maiores salarios', 'maior salario', 'salarios mais', 'quem ganha', 'quem recebe',
  );
}

function kpiValue(k) {
  if (k.format === 'currency') return formatCurrency(k.value, { compact: true });
  if (k.format === 'percent') return formatPercent(k.value);
  if (k.format === 'days') return pick(`${formatNumber(k.value, 0)} dias`, `${formatNumber(k.value, 0)} days`);
  if (k.format === 'years') return pick(`${formatNumber(k.value, 1)} anos`, `${formatNumber(k.value, 1)} years`);
  return formatNumber(k.value);
}

function tableAnswer(filename, sheetName, title, columns, rows) {
  const t = txt(title);
  return {
    text: pick(
      `Aqui está a tabela de **${t.toLowerCase()}**. Você pode baixá-la em Excel no botão abaixo.`,
      `Here is the **${t.toLowerCase()}** table. You can download it as Excel using the button below.`,
    ),
    table: { title: t, columns, rows, filename, sheetName },
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
      text: pick(
        `Colaboradores com maior banco de horas extras (soma do período). Mostrando o top 30 — baixe o Excel para todos. Clique no nome para abrir a ficha.`,
        `Employees with the largest overtime bank (sum for the period). Showing the top 30 — download the Excel for all. Click a name to open the profile.`,
      ),
      table: {
        title: txt('Banco de horas por colaborador'),
        columns: [
          { key: 'name', label: txt('Nome'), href: (r) => `/funcionario/${r.id}` }, { key: 'area', label: txt('Diretoria') }, { key: 'roleLevel', label: txt('Cargo') },
          { key: 'managerName', label: txt('Gestor') }, { key: 'hours', label: txt('Banco de horas (h)'), align: 'right', render: (r) => num(r.hours) },
        ],
        rows: top,
        exportRows: ranked.map((r) => ({ Nome: r.name, Diretoria: r.area, Cargo: r.roleLevel, Gestor: r.managerName, 'Banco de horas (h)': r.hours })),
        filename: 'banco_de_horas', sheetName: 'Banco de horas',
      },
    };
  }

  // Ranking de maiores salários (opcionalmente por diretoria citada).
  if (has(q, 'salario', 'salarios', 'salário', 'salários', 'remuneracao', 'remuneração', 'quem ganha', 'quem recebe')
    && !has(q, 'posicionamento', 'compa', 'faixa salarial', 'medio', 'media', 'média')) {
    const area = findArea(q);
    let emps = metrics.activeNow;
    if (area) emps = emps.filter((e) => e.area === area);
    const ranked = [...emps].sort((a, b) => b.salary - a.salary);
    const top = ranked.slice(0, 30).map((e) => ({ id: e.id, name: e.name, area: e.area, roleLevel: e.roleLevel, managerName: e.managerName, salary: e.salary }));
    const areaPt = area ? ` da diretoria **${area}**` : '';
    const areaEn = area ? ` in the **${area}** division` : '';
    return {
      text: pick(
        `Colaboradores com os maiores salários${areaPt}. Mostrando o top 30 — baixe o Excel para todos. Clique no nome para abrir a ficha.`,
        `Employees with the highest salaries${areaEn}. Showing the top 30 — download the Excel for all. Click a name to open the profile.`,
      ),
      table: {
        title: txt('Maiores salários'),
        columns: [
          { key: 'name', label: txt('Nome'), href: (r) => `/funcionario/${r.id}` },
          { key: 'area', label: txt('Diretoria') },
          { key: 'roleLevel', label: txt('Cargo') },
          { key: 'managerName', label: txt('Gestor') },
          { key: 'salary', label: txt('Salário'), align: 'right', render: (r) => formatCurrency(r.salary) },
        ],
        rows: top,
        exportRows: ranked.map((r) => ({ Nome: r.name, Diretoria: r.area, Cargo: r.roleLevel, Gestor: r.managerName, Salário: r.salary })),
        filename: 'maiores_salarios', sheetName: 'Salários',
      },
    };
  }

  // Lista de colaboradores (nome a nome), opcionalmente filtrada por diretoria citada.
  if (has(q, 'funcionario', 'colaborador', 'pessoas', 'nomes', 'quem sao', 'quem são', 'quadro de pessoas')) {
    const area = findArea(q);
    let emps = metrics.activeNow;
    if (area) emps = emps.filter((e) => e.area === area);
    const columns = [
      { key: 'name', label: txt('Nome'), href: (r) => `/funcionario/${r.id}` },
      { key: 'area', label: txt('Diretoria') },
      { key: 'roleLevel', label: txt('Cargo') },
      { key: 'managerName', label: txt('Gestor') },
      { key: 'unit', label: txt('Unidade') },
      { key: 'salary', label: txt('Salário'), align: 'right', render: (r) => cur(r.salary) },
      { key: 'admissao', label: txt('Admissão') },
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
    const areaPt = area ? ` da diretoria **${area}**` : '';
    const areaEn = area ? ` in the **${area}** division` : '';
    const morePt = all.length > 50 ? ' Mostrando os primeiros 50; baixe o Excel para a lista completa.' : '';
    const moreEn = all.length > 50 ? ' Showing the first 50; download the Excel for the full list.' : '';
    return {
      text: pick(
        `Lista de colaboradores ativos${areaPt} — **${num(all.length)}** no total.${morePt} Clique no nome para abrir a ficha.`,
        `List of active employees${areaEn} — **${num(all.length)}** in total.${moreEn} Click a name to open the profile.`,
      ),
      table: { title: area ? pick(`Colaboradores · ${area}`, `Employees · ${area}`) : txt('Colaboradores ativos'), columns, rows: display, exportRows, filename: 'funcionarios', sheetName: 'Funcionários' },
    };
  }

  if (has(q, 'aso', 'exame ocupacional', 'exames') && hr) {
    return tableAnswer('aso_por_tipo', 'ASO', 'ASO por tipo de exame',
      [{ key: 'label', label: txt('Tipo') }, { key: 'count', label: txt('Exames/mês'), align: 'right', render: (r) => num(r.count) }], hr.aso.byType);
  }
  if (has(q, ' epi', 'equipamento de prot') && hr) {
    return tableAnswer('epi_consumo', 'EPI', 'Consumo de EPI por tipo',
      [{ key: 'label', label: txt('EPI') }, { key: 'value', label: txt('Consumo/mês'), align: 'right', render: (r) => num(r.value) }, { key: 'cost', label: txt('Custo'), align: 'right', render: (r) => cur(r.cost) }], hr.epi.consumo);
  }
  if (has(q, 'nr-', 'nr ', 'norma regulament', ' nrs') && hr) {
    return tableAnswer('treinamentos_nrs', 'NRs', 'Cobertura de treinamentos de NRs',
      [{ key: 'label', label: txt('NR') }, { key: 'value', label: txt('Cobertura (%)'), align: 'right', render: (r) => `${num(r.value)}%` }], hr.nrs.cobertura);
  }
  if (has(q, 'pcd', 'deficien') && hr) {
    return tableAnswer('pcd_por_diretoria', 'PCD', 'PCD por diretoria',
      [{ key: 'area', label: txt('Diretoria') }, { key: 'count', label: txt('PCD'), align: 'right', render: (r) => num(r.count) }, { key: 'pct', label: '%', align: 'right', render: (r) => pct(r.pct) }], hr.pcd.byArea);
  }
  if (has(q, 'aprendiz') && hr) {
    return tableAnswer('jovem_aprendiz', 'Aprendizes', 'Jovem aprendiz por diretoria',
      [{ key: 'area', label: txt('Diretoria') }, { key: 'count', label: txt('Aprendizes'), align: 'right', render: (r) => num(r.count) }], hr.apprentices.byArea);
  }
  if (has(q, 'disciplinar', 'advertenc', 'suspensao', 'justa causa') && hr) {
    return tableAnswer('medidas_disciplinares', 'Disciplinar', 'Medidas disciplinares por motivo',
      [{ key: 'reason', label: txt('Motivo') }, { key: 'count', label: txt('Ocorrências'), align: 'right', render: (r) => num(r.count) }], hr.disciplinary.byReason);
  }
  if (has(q, 'chamado', 'ticket', 'atendimento') && hr) {
    return tableAnswer('chamados_rh', 'Chamados', 'Chamados de RH por categoria',
      [{ key: 'label', label: txt('Categoria') }, { key: 'value', label: txt('Chamados'), align: 'right', render: (r) => num(r.value) }], hr.tickets.byCategory);
  }
  if (has(q, 'trabalhista', 'reclamat', 'processo') && hr) {
    return tableAnswer('trabalhista', 'Trabalhista', 'Processos trabalhistas por motivo',
      [{ key: 'reason', label: txt('Motivo') }, { key: 'count', label: txt('Processos'), align: 'right', render: (r) => num(r.count) }], hr.labor.byReason);
  }
  if (has(q, 'posicionamento', 'compa', 'faixa salarial') && hr) {
    return tableAnswer('posicionamento_salarial', 'Posicionamento', 'Compa-ratio por diretoria',
      [{ key: 'area', label: txt('Diretoria') }, { key: 'compa', label: txt('Compa-ratio'), align: 'right', render: (r) => formatNumber(r.compa, 2) }], hr.positioning.byArea);
  }

  if (has(q, 'turnover', 'rotativ', 'deslig')) {
    return tableAnswer('turnover_por_diretoria', 'Turnover', 'Turnover por diretoria (12 meses)',
      [
        { key: 'area', label: txt('Diretoria') },
        { key: 'count', label: txt('Desligamentos'), align: 'right', render: (r) => num(r.count) },
        { key: 'rate', label: txt('Taxa'), align: 'right', render: (r) => pct(r.rate) },
        { key: 'cost', label: txt('Custo estimado'), align: 'right', render: (r) => cur(r.cost) },
      ], metrics.turnoverByArea);
  }
  if (has(q, 'atestado', 'cid', 'saude mental') && medical) {
    return tableAnswer('atestados_por_cid', 'Atestados', 'Atestados por grupo de CID (12 meses)',
      [
        { key: 'label', label: txt('Grupo CID') },
        { key: 'code', label: txt('Faixa') },
        { key: 'count', label: txt('Atestados'), align: 'right', render: (r) => num(r.count) },
        { key: 'days', label: txt('Dias perdidos'), align: 'right', render: (r) => num(r.days) },
      ], medical.groups);
  }
  if (has(q, 'seguranca', 'paralisac', 'paralisaç', 'acidente', 'inspec') && safety) {
    return tableAnswer('seguranca_paralisacoes', 'Segurança', 'Paralisações por motivo (12 meses)',
      [
        { key: 'label', label: txt('Motivo') },
        { key: 'value', label: txt('Paralisações'), align: 'right', render: (r) => num(r.value) },
      ], safety.stoppagesByReason);
  }
  if (has(q, 'absent', 'falta')) {
    if (has(q, 'gestor')) {
      return tableAnswer('absenteismo_por_gestor', 'Absenteísmo', 'Absenteísmo por gestor (dias)',
        [
          { key: 'manager', label: txt('Gestor') },
          { key: 'days', label: txt('Dias perdidos'), align: 'right', render: (r) => num(r.days) },
        ], metrics.absenteeismByManager);
    }
    return tableAnswer('absenteismo_por_motivo', 'Absenteísmo', 'Absenteísmo por motivo (dias)',
      [
        { key: 'reason', label: txt('Motivo') },
        { key: 'days', label: txt('Dias perdidos'), align: 'right', render: (r) => num(r.days) },
      ], metrics.absenteeismByReason);
  }
  if (has(q, 'hora extra')) {
    return tableAnswer('horas_extras_por_diretoria', 'Horas Extras', 'Custo de horas extras por diretoria',
      [
        { key: 'area', label: txt('Diretoria') },
        { key: 'cost', label: txt('Custo estimado'), align: 'right', render: (r) => cur(r.cost) },
      ], metrics.overtimeByArea);
  }
  if (has(q, 'risco')) {
    return tableAnswer('risco_de_saida', 'Risco', 'Colaboradores com maior risco de saída',
      [
        { key: 'area', label: txt('Diretoria') },
        { key: 'managerName', label: txt('Gestor') },
        { key: 'score', label: txt('Score'), align: 'right', render: (r) => num(r.score) },
        { key: 'level', label: txt('Nível') },
      ], risk.slice(0, 15));
  }
  if (has(q, 'diversidade', 'genero', 'raca')) {
    return tableAnswer('diversidade_genero', 'Diversidade', 'Distribuição por gênero',
      [
        { key: 'label', label: txt('Gênero') },
        { key: 'count', label: txt('Pessoas'), align: 'right', render: (r) => num(r.count) },
        { key: 'pct', label: '%', align: 'right', render: (r) => pct(r.pct) },
      ], metrics.diversity.gender);
  }
  if (has(q, 'cargo', 'nivel')) {
    return tableAnswer('headcount_por_cargo', 'Cargos', 'Headcount por cargo',
      [
        { key: 'role', label: txt('Cargo') },
        { key: 'count', label: txt('Pessoas'), align: 'right', render: (r) => num(r.count) },
      ], metrics.headcountByRole);
  }
  if (has(q, 'headcount', 'quadro', 'diretoria', 'area', 'colaboradores')) {
    return tableAnswer('headcount_por_diretoria', 'Headcount', 'Headcount por diretoria',
      [
        { key: 'area', label: txt('Diretoria') },
        { key: 'count', label: txt('Pessoas'), align: 'right', render: (r) => num(r.count) },
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
      [{ key: 'manager', label: txt('Gestor') }, { key: 'size', label: txt('Time (pessoas)'), align: 'right', render: (r) => num(r.size) }], rows);
  }
  if (has(q, 'unidade', 'regional', 'filial', 'escritorio')) {
    const units = new Map();
    for (const e of metrics.activeNow) units.set(e.unit, (units.get(e.unit) ?? 0) + 1);
    const rows = [...units.entries()].map(([unit, count]) => ({ unit, count })).sort((a, b) => b.count - a.count);
    return tableAnswer('headcount_por_unidade', 'Unidades', 'Headcount por unidade',
      [{ key: 'unit', label: txt('Unidade') }, { key: 'count', label: txt('Pessoas'), align: 'right', render: (r) => num(r.count) }], rows);
  }
  if (has(q, 'treinamento', 'capacita') && metrics.training?.topTrainings) {
    return tableAnswer('treinamentos', 'Treinamentos', 'Treinamentos mais concluídos',
      [{ key: 'name', label: txt('Treinamento') }, { key: 'count', label: txt('Concluíram'), align: 'right', render: (r) => num(r.count) }], metrics.training.topTrainings);
  }

  // KPIs só quando o usuário pede explicitamente indicadores/painel/resumo. Sem match,
  // retorna null para a pergunta ir para a IA (Gemini) em vez de cair numa tabela genérica.
  if (has(q, 'indicador', 'kpi', 'painel', 'resumo', 'resumão')) {
    return tableAnswer('indicadores_do_mes', 'Indicadores', 'Indicadores do mês',
      [
        { key: 'label', label: txt('Indicador') },
        { key: 'valor', label: txt('Valor'), align: 'right' },
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
  const { metrics, forecasts, insights, risk, targets, medical, safety, hr, production } = ctx;
  const q = normalize(question);
  const last = (arr) => arr[arr.length - 1];
  const prev = (arr) => arr[arr.length - 2];

  const mentionedEmployee = findEmployeeMention(q, metrics.activeNow);
  if (mentionedEmployee) {
    const riskEntry = risk.find((r) => r.id === mentionedEmployee.id);
    return {
      text: pick(
        `Encontrei **${mentionedEmployee.name}** no quadro atual — aqui está o resumo:`,
        `Found **${mentionedEmployee.name}** in the current headcount — here is the summary:`,
      ),
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

  // Ranking ambíguo ("ofensores", "os piores") sem métrica definida → pede esclarecimento
  // com botões de opção (cada botão já envia a pergunta completa).
  if (has(q, 'ofensor', 'piores', 'maiores problemas', 'principais problemas')
    && !has(q, 'turnover', 'rotativ', 'absent', 'falta', 'hora extra', 'horas extras', 'atestado', 'custo', 'headcount', 'seguranca', 'acidente', 'epi', 'trabalhista')) {
    return {
      text: pick(
        'Posso montar o ranking dos maiores ofensores — de qual indicador?',
        'I can build the ranking of the top offenders — for which metric?',
      ),
      quickReplies: [
        { label: txt('Turnover'), prompt: 'tabela de turnover por diretoria' },
        { label: txt('Absenteísmo'), prompt: 'tabela de absenteísmo por gestor' },
        { label: txt('Horas extras'), prompt: 'tabela de horas extras por diretoria' },
        { label: txt('Atestados'), prompt: 'tabela de atestados por CID' },
      ],
    };
  }

  // Produtividade da linha de montagem (OEE, takt, gargalo, faltas na linha).
  if (production && has(
    q, 'produtividade', 'linha de montagem', 'linha de produc', 'na linha', 'gargalo', 'takt',
    'oee', 'estacao', 'estacoes', 'cadencia', 'chao de fabrica', 'montagem final', 'bater a meta',
    'veiculos/dia', 'veiculos por dia', 'producao da linha', 'produtiva',
  )) {
    const p = production;
    const oeePct = Math.round(p.oee * 100);
    const bn = p.bottleneck;
    const meta = p.carsDay >= p.demandPerDay;
    const atRisk = [...p.stations].filter((s) => !s.isBottleneck && s.buffer >= 0).sort((a, b) => a.buffer - b.buffer)[0];

    // Tabela detalhada quando o usuário pede lista/tabela/detalhe por estação.
    if (has(q, 'tabela', 'lista', 'detalhe', 'por estacao', 'cada estacao', 'estacoes')) {
      return tableAnswer('produtividade_estacoes', 'Estações', 'Produtividade por estação',
        [
          { key: 'name', label: txt('Estação') },
          { key: 'assigned', label: txt('Postos'), align: 'right', render: (r) => formatNumber(r.assigned) },
          { key: 'present', label: txt('Presentes'), align: 'right', render: (r) => formatNumber(r.present) },
          { key: 'absent', label: txt('Faltas'), align: 'right', render: (r) => formatNumber(r.absent) },
          { key: 'capacity', label: txt('Capac. (veíc/h)'), align: 'right', render: (r) => formatNumber(r.capacity, 1) },
          { key: 'cycle', label: txt('Cadência (s)'), align: 'right', render: (r) => formatNumber(r.cycle, 0) },
          { key: 'statusLabel', label: txt('Status') },
        ], p.stations);
    }

    const chartData = [...p.stations].sort((a, b) => b.cycle - a.cycle).map((s) => ({ label: s.short, cadencia: Math.round(s.cycle) }));
    const metaPt = meta ? '✓ no alvo' : `${formatNumber(p.demandPerDay - p.carsDay)} abaixo`;
    const metaEn = meta ? '✓ on target' : `${formatNumber(p.demandPerDay - p.carsDay)} below`;
    const atRiskPt = atRisk ? ` A estação de menor folga é **${atRisk.name}**, que aguenta só ${atRisk.buffer} falta${atRisk.buffer === 1 ? '' : 's'} a mais antes de virar gargalo.` : '';
    const atRiskEn = atRisk ? ` The station with the least slack is **${atRisk.name}**, which can take only ${atRisk.buffer} more absence${atRisk.buffer === 1 ? '' : 's'} before becoming a bottleneck.` : '';
    return {
      text: pick(
        `A linha está com **OEE de ${oeePct}%** e produção projetada de **${formatNumber(p.carsDay)} veículos/dia** (meta ${formatNumber(p.demandPerDay)} — ${metaPt}). O gargalo é a estação **${bn.name}**, com cadência de ${formatNumber(bn.cycle, 0)}s por veículo contra um takt de ${p.takt}s. Hoje há **${formatNumber(p.totalPresent)} operadores presentes** de ${formatNumber(p.totalAssigned)} alocados (${formatNumber(p.totalAbsent)} faltas, ${formatPercent(p.absenceRate * 100)}).${atRiskPt}`,
        `The line is running at **${oeePct}% OEE** with a projected output of **${formatNumber(p.carsDay)} vehicles/day** (target ${formatNumber(p.demandPerDay)} — ${metaEn}). The bottleneck is station **${bn.name}**, with a cycle time of ${formatNumber(bn.cycle, 0)}s per vehicle against a takt of ${p.takt}s. Today there are **${formatNumber(p.totalPresent)} operators present** out of ${formatNumber(p.totalAssigned)} assigned (${formatNumber(p.totalAbsent)} absences, ${formatPercent(p.absenceRate * 100)}).${atRiskEn}`,
      ),
      chart: { type: 'bar', title: txt('Cadência por estação (s/veículo) — maior = gargalo'), data: chartData, valueKey: 'cadencia', labelKey: 'label', formatValue: (v) => `${formatNumber(v, 0)}s` },
      recommendations: [
        pick(
          `Reforçar ou realocar operadores na estação ${bn.name} — é ela que dita o ritmo da linha (teoria das restrições).`,
          `Reinforce or reallocate operators at station ${bn.name} — it sets the pace of the line (theory of constraints).`,
        ),
        atRisk
          ? pick(`Monitorar faltas em ${atRisk.name}: baixa folga até virar o próximo gargalo.`, `Monitor absences at ${atRisk.name}: low slack before it becomes the next bottleneck.`)
          : pick('Manter o balanceamento atual — as estações têm folga frente ao takt.', 'Keep the current balancing — the stations have slack against the takt.'),
        pick(
          'Ampliar a polivalência (cross-training) para realocar pessoas entre estações quando houver falta concentrada.',
          'Expand multi-skilling (cross-training) to reallocate people across stations when absences concentrate.',
        ),
      ],
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
      text: pick(
        `Cruzando as duas métricas por diretoria, **${top.area}** tem o maior turnover (${formatPercent(top.rate)}) e um custo de horas extras de ${formatCurrency(top.otCost, { compact: true })} no período. Em geral, diretorias com mais horas extras (sobrecarga) tendem a mostrar turnover mais alto — é uma associação observada nos dados, não causalidade comprovada.`,
        `Cross-referencing the two metrics by division, **${top.area}** has the highest turnover (${formatPercent(top.rate)}) and an overtime cost of ${formatCurrency(top.otCost, { compact: true })} in the period. In general, divisions with more overtime (overload) tend to show higher turnover — this is an association observed in the data, not proven causation.`,
      ),
      chart: { type: 'bar', title: txt('Turnover por diretoria (12 meses)'), data: rows.slice(0, 6), valueKey: 'rate', labelKey: 'area', formatValue: (v) => formatPercent(v) },
      recommendations: [
        pick(`Investigar carga de trabalho e horas extras em ${top.area}, onde turnover e HE aparecem altos juntos.`, `Investigate workload and overtime in ${top.area}, where turnover and overtime appear high together.`),
        pick('Definir um teto de horas extras por equipe e acompanhá-lo como sinal antecipado de risco de saída.', 'Set an overtime cap per team and track it as an early signal of attrition risk.'),
      ],
    };
  }

  if (has(q, 'atestado', 'cid', 'afastamento', 'saude mental', 'licenca medica')) {
    if (!medical) return { text: pick('Os dados de atestados estão disponíveis no dashboard de Atestados.', 'Sick-note data is available on the Sick Notes dashboard.') };
    const k = medical.kpis;
    const topG = medical.groups[0];
    return {
      text: pick(
        `No último mês foram **${formatNumber(k.atestadosMes)} atestados**, somando ${formatNumber(k.diasMes)} dias perdidos. A saúde mental (CID F) responde por **${formatPercent(k.pctMental)}** dos atestados e ${formatNumber(k.inss15)} afastamentos passaram de 15 dias (encaminhados ao INSS). O grupo de maior volume é **${topG.label}**.`,
        `Last month there were **${formatNumber(k.atestadosMes)} sick notes**, totaling ${formatNumber(k.diasMes)} days lost. Mental health (ICD F) accounts for **${formatPercent(k.pctMental)}** of the sick notes and ${formatNumber(k.inss15)} leaves exceeded 15 days (referred to the INSS). The highest-volume group is **${topG.label}**.`,
      ),
      chart: { type: 'bar', title: txt('Atestados por grupo de CID (12 meses)'), data: medical.groups.slice(0, 6), valueKey: 'count', labelKey: 'label', formatValue: (v) => formatNumber(v) },
      recommendations: [
        pick('Acompanhar a tendência de saúde mental (CID F), em alta na série mensal.', 'Track the mental-health trend (ICD F), rising in the monthly series.'),
        pick('Identificar as diretorias de maior concentração no mapa do dashboard de Atestados.', 'Identify the divisions with the highest concentration on the Sick Notes dashboard map.'),
      ],
    };
  }

  if (has(q, 'seguranca', 'acidente', 'paralisac', 'paralisaç', 'inspec', 'sst', ' epi')) {
    if (!safety) return { text: pick('Os dados de segurança estão disponíveis no dashboard de Segurança do Trabalho.', 'Safety data is available on the Occupational Safety dashboard.') };
    const k = safety.kpis;
    const topR = safety.stoppagesByReason[0];
    return {
      text: pick(
        `Estamos há **${formatNumber(k.daysWithoutAccident)} dias sem acidente** com afastamento. A taxa de frequência (TF) é ${formatNumber(k.tf, 1)} e a de gravidade (TG) ${formatNumber(k.tg)}. Foram **${formatNumber(k.paralisacoes12)} paralisações** em 12 meses, sendo o principal motivo "${topR?.label}". A conformidade das inspeções está em ${formatPercent(k.conformidade)}.`,
        `We have gone **${formatNumber(k.daysWithoutAccident)} days without a lost-time accident**. The frequency rate (FR) is ${formatNumber(k.tf, 1)} and the severity rate (SR) ${formatNumber(k.tg)}. There were **${formatNumber(k.paralisacoes12)} stoppages** in 12 months, the main reason being "${topR?.label}". Inspection compliance is at ${formatPercent(k.conformidade)}.`,
      ),
      chart: { type: 'bar', title: txt('Paralisações por motivo (12 meses)'), data: safety.stoppagesByReason, valueKey: 'value', labelKey: 'label', formatValue: (v) => formatNumber(v) },
      recommendations: [
        pick(`Priorizar o controle de "${topR?.label}", principal causa de paralisação.`, `Prioritize controlling "${topR?.label}", the main cause of stoppages.`),
        pick('Reforçar inspeções nas diretorias de maior concentração de acidentes.', 'Reinforce inspections in the divisions with the highest accident concentration.'),
      ],
    };
  }

  if (has(q, 'turnover', 'rotativ')) {
    const turn = last(metrics.turnoverSeries);
    const turnPrev = prev(metrics.turnoverSeries);
    const topArea = [...metrics.turnoverByArea].sort((a, b) => b.rate - a.rate)[0];
    const last12Cost = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0);
    return {
      text: pick(
        `O turnover do último mês fechado foi de ${formatPercent(turn.totalRate)}, contra ${formatPercent(turnPrev.totalRate)} no mês anterior (${turn.totalRate >= turnPrev.totalRate ? 'alta' : 'queda'} de ${formatNumber(Math.abs(turn.totalRate - turnPrev.totalRate), 2)} p.p.). A diretoria com maior taxa nos últimos 12 meses é **${topArea.area}**, com ${formatPercent(topArea.rate)}.`,
        `Turnover in the last closed month was ${formatPercent(turn.totalRate)}, vs. ${formatPercent(turnPrev.totalRate)} the previous month (${turn.totalRate >= turnPrev.totalRate ? 'up' : 'down'} ${formatNumber(Math.abs(turn.totalRate - turnPrev.totalRate), 2)} p.p.). The division with the highest rate over the last 12 months is **${topArea.area}**, at ${formatPercent(topArea.rate)}.`,
      ),
      chart: { type: 'bar', title: txt('Turnover por diretoria (12 meses)'), data: metrics.turnoverByArea.slice(0, 6), valueKey: 'rate', labelKey: 'area', formatValue: (v) => formatPercent(v) },
      financialImpact: pick(
        `Custo estimado do turnover nos últimos 12 meses: ${formatCurrency(last12Cost, { compact: true })} (reposição, ramp-up e perda de produtividade).`,
        `Estimated turnover cost over the last 12 months: ${formatCurrency(last12Cost, { compact: true })} (replacement, ramp-up and lost productivity).`,
      ),
      recommendations: [
        pick(`Priorizar ação de retenção em ${topArea.area}, a diretoria com maior taxa de saída.`, `Prioritize retention action in ${topArea.area}, the division with the highest attrition rate.`),
        pick('Revisar motivos de desligamento voluntário mais recorrentes com os gestores da diretoria.', 'Review the most recurring voluntary-termination reasons with the division managers.'),
        pick('Acompanhar o forecast de turnover dos próximos 3 meses para antecipar picos.', 'Track the turnover forecast for the next 3 months to anticipate spikes.'),
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
      text: pick(
        `Analisando o modelo de risco de saída por colaborador, a diretoria **${top.area}** apresenta o maior risco médio (score ${formatNumber(top.avgScore, 0)}/100), com ${top.highCount} colaboradores classificados como "Alto" ou "Muito Alto" risco.`,
        `Analyzing the per-employee attrition-risk model, the **${top.area}** division shows the highest average risk (score ${formatNumber(top.avgScore, 0)}/100), with ${top.highCount} employees classified as "High" or "Very High" risk.`,
      ),
      chart: { type: 'bar', title: txt('Score médio de risco por diretoria'), data: ranked.slice(0, 6), valueKey: 'avgScore', labelKey: 'area', formatValue: (v) => formatNumber(v, 0) },
      recommendations: [
        pick(`Priorizar conversas 1:1 e planos de desenvolvimento individual em ${top.area}.`, `Prioritize 1:1 conversations and individual development plans in ${top.area}.`),
        pick('Revisar equidade salarial frente à mediana da diretoria para colaboradores de alto risco.', 'Review pay equity against the division median for high-risk employees.'),
        pick('Monitorar engajamento e horas extras recorrentes como sinais de alerta antecipado.', 'Monitor engagement and recurring overtime as early warning signals.'),
      ],
    };
  }

  if (has(q, 'gestor') && has(q, 'absent', 'falta')) {
    const top = metrics.absenteeismByManager[0];
    return {
      text: pick(
        `O gestor com maior volume de absenteísmo em sua equipe nos últimos 24 meses é **${top?.manager}**, com ${formatNumber(top?.days ?? 0)} dias perdidos acumulados.`,
        `The manager with the highest absenteeism volume in their team over the last 24 months is **${top?.manager}**, with ${formatNumber(top?.days ?? 0)} accumulated days lost.`,
      ),
      chart: { type: 'bar', title: txt('Absenteísmo por gestor (dias)'), data: metrics.absenteeismByManager, valueKey: 'days', labelKey: 'manager', formatValue: (v) => formatNumber(v) },
      recommendations: [
        pick('Investigar causas específicas do time — atestados recorrentes podem indicar sobrecarga ou clima organizacional.', 'Investigate team-specific causes — recurring sick notes may indicate overload or organizational climate.'),
        pick('Comparar com o índice médio da unidade para verificar se é um caso isolado ou padrão de diretoria.', 'Compare with the unit average to check whether it is an isolated case or a division-wide pattern.'),
      ],
    };
  }

  if (has(q, 'resum', 'indicadores do mes', 'como estamos')) {
    return {
      text: pick(
        `Resumo executivo do período fechado em ${metrics.labels[metrics.labels.length - 1]}: headcount de ${formatNumber(metrics.activeNow.length)} colaboradores, turnover de ${formatPercent(last(metrics.turnoverSeries).totalRate)} e absenteísmo de ${formatPercent(last(metrics.absenteeismSeries).rate)}. A folha de pagamento soma ${formatCurrency(last(metrics.payrollSeries).total, { compact: true })}/mês. A tabela abaixo compara cada indicador com o mês anterior e com a meta, quando há orçamento definido.`,
        `Executive summary for the period closed in ${metrics.labels[metrics.labels.length - 1]}: headcount of ${formatNumber(metrics.activeNow.length)} employees, turnover of ${formatPercent(last(metrics.turnoverSeries).totalRate)} and absenteeism of ${formatPercent(last(metrics.absenteeismSeries).rate)}. Payroll totals ${formatCurrency(last(metrics.payrollSeries).total, { compact: true })}/month. The table below compares each indicator with the previous month and with the target, where a budget is defined.`,
      ),
      execSummary: buildExecutiveSummary(metrics, targets),
      recommendations: insights.slice(0, 3).map((i) => i.title),
    };
  }

  if (has(q, 'relatorio executivo', 'crie um relatorio', 'gerar relatorio')) {
    return {
      text: pick(
        `Relatório executivo gerado com base nos dados atuais. Principais destaques do período:\n\n${insights.slice(0, 4).map((i) => `• ${i.title}`).join('\n')}\n\nO relatório completo em PDF/PowerPoint pode ser baixado na página **Relatórios**.`,
        `Executive report generated from the current data. Key highlights of the period:\n\n${insights.slice(0, 4).map((i) => `• ${i.title}`).join('\n')}\n\nThe full report in PDF/PowerPoint can be downloaded on the **Reports** page.`,
      ),
      recommendations: [pick('Acessar a página Relatórios para exportar a versão formatada em PDF ou PowerPoint.', 'Go to the Reports page to export the formatted version in PDF or PowerPoint.')],
    };
  }

  if (has(q, 'custo', 'quanto custa')) {
    const last12Cost = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0);
    const otCost = metrics.overtimeSeries.slice(-12).reduce((s, o) => s + o.cost, 0);
    return {
      text: pick(
        `Nos últimos 12 meses, o turnover custou aproximadamente ${formatCurrency(last12Cost, { compact: true })} e as horas extras somaram ${formatCurrency(otCost, { compact: true })} em custo adicional à folha.`,
        `Over the last 12 months, turnover cost approximately ${formatCurrency(last12Cost, { compact: true })} and overtime added ${formatCurrency(otCost, { compact: true })} in extra payroll cost.`,
      ),
      financialImpact: pick(
        `Custo total combinado: ${formatCurrency(last12Cost + otCost, { compact: true })}.`,
        `Combined total cost: ${formatCurrency(last12Cost + otCost, { compact: true })}.`,
      ),
    };
  }

  if (has(q, 'grafico', 'explique esse')) {
    return {
      text: pick(
        'Os gráficos deste painel usam sempre a mesma leitura: o eixo de valor representa a métrica selecionada (ex.: taxa, dias, horas ou custo) e as barras/linhas comparam períodos ou recortes (diretoria, gestor, unidade). Cores mais intensas em mapas de calor indicam valores mais altos. Se quiser, pergunte sobre um indicador específico (ex.: "explique o turnover da diretoria Comercial") que eu detalho os números por trás dele.',
        'The charts in this panel always read the same way: the value axis represents the selected metric (e.g., rate, days, hours or cost) and the bars/lines compare periods or breakdowns (division, manager, unit). More intense colors in heatmaps indicate higher values. If you like, ask about a specific indicator (e.g., "explain turnover for the Commercial division") and I will detail the numbers behind it.',
      ),
    };
  }

  if (has(q, 'absenteismo', 'falta')) {
    const last12 = metrics.absenteeismSeries.slice(-12).reduce((s, a) => s + a.totalDays, 0);
    const breakdown = wantsBreakdown(q);
    const reasonPt = breakdown ? ` O principal motivo registrado é "${metrics.absenteeismByReason[0]?.reason}".` : '';
    const reasonEn = breakdown ? ` The main recorded reason is "${metrics.absenteeismByReason[0]?.reason}".` : '';
    return {
      text: pick(
        `O índice de absenteísmo do último mês fechado é ${formatPercent(last(metrics.absenteeismSeries).rate)}, totalizando ${formatNumber(last12)} dias perdidos nos últimos 12 meses.${reasonPt}`,
        `The absenteeism rate for the last closed month is ${formatPercent(last(metrics.absenteeismSeries).rate)}, totaling ${formatNumber(last12)} days lost over the last 12 months.${reasonEn}`,
      ),
      chart: breakdown ? { type: 'bar', title: txt('Motivos de absenteísmo'), data: metrics.absenteeismByReason, valueKey: 'days', labelKey: 'reason', formatValue: (v) => formatNumber(v) } : undefined,
    };
  }

  if (has(q, 'headcount', 'quadro', 'colaboradores')) {
    const breakdown = wantsBreakdown(q);
    const distPt = breakdown ? `, distribuídos principalmente em ${metrics.headcountByArea[0].area} (${formatNumber(metrics.headcountByArea[0].count)}) e ${metrics.headcountByArea[1].area} (${formatNumber(metrics.headcountByArea[1].count)})` : '';
    const distEn = breakdown ? `, distributed mainly across ${metrics.headcountByArea[0].area} (${formatNumber(metrics.headcountByArea[0].count)}) and ${metrics.headcountByArea[1].area} (${formatNumber(metrics.headcountByArea[1].count)})` : '';
    return {
      text: pick(
        `O headcount ativo atual é de ${formatNumber(metrics.activeNow.length)} colaboradores${distPt}.`,
        `The current active headcount is ${formatNumber(metrics.activeNow.length)} employees${distEn}.`,
      ),
      chart: breakdown ? { type: 'bar', title: txt('Headcount por diretoria'), data: metrics.headcountByArea, valueKey: 'count', labelKey: 'area', formatValue: (v) => formatNumber(v) } : undefined,
    };
  }

  if (has(q, 'horas extras', 'hora extra')) {
    const last12 = metrics.overtimeSeries.slice(-12).reduce((s, o) => s + o.cost, 0);
    const breakdown = wantsBreakdown(q);
    const areaPt = breakdown ? `, com a diretoria ${metrics.overtimeByArea[0]?.area} concentrando o maior volume` : '';
    const areaEn = breakdown ? `, with the ${metrics.overtimeByArea[0]?.area} division concentrating the highest volume` : '';
    return {
      text: pick(
        `O custo de horas extras nos últimos 12 meses somou ${formatCurrency(last12, { compact: true })}${areaPt}.`,
        `Overtime cost over the last 12 months totaled ${formatCurrency(last12, { compact: true })}${areaEn}.`,
      ),
      chart: breakdown ? { type: 'bar', title: txt('Custo de horas extras por diretoria'), data: metrics.overtimeByArea, valueKey: 'cost', labelKey: 'area', formatValue: (v) => formatCurrency(v, { compact: true }) } : undefined,
    };
  }

  if (has(q, 'diversidade', 'genero', 'mulheres', 'raca')) {
    const women = metrics.diversity.gender.find((g) => g.label === 'Feminino')?.pct ?? 0;
    const womenLead = metrics.diversity.leadershipGender.find((g) => g.label === 'Feminino')?.pct ?? 0;
    return {
      text: pick(
        `Mulheres representam ${formatPercent(women)} do quadro total e ${formatPercent(womenLead)} das posições de liderança. O quadro de PCD é de ${formatPercent(metrics.diversity.pcdPct)}.`,
        `Women make up ${formatPercent(women)} of the total workforce and ${formatPercent(womenLead)} of leadership positions. People with disabilities make up ${formatPercent(metrics.diversity.pcdPct)}.`,
      ),
      chart: { type: 'bar', title: txt('Distribuição por gênero'), data: metrics.diversity.gender, valueKey: 'pct', labelKey: 'label', formatValue: (v) => formatPercent(v) },
    };
  }

  if (has(q, 'treinamento', 'capacitacao')) {
    return {
      text: pick(
        `Foram registradas ${formatNumber(metrics.training.hoursTotal)} horas de treinamento no ano, com ${formatPercent(metrics.training.participationPct)} de participação e ROI estimado de R$ ${formatNumber(metrics.training.roiRatio, 2)} para cada real investido.`,
        `${formatNumber(metrics.training.hoursTotal)} training hours were recorded this year, with ${formatPercent(metrics.training.participationPct)} participation and an estimated ROI of R$ ${formatNumber(metrics.training.roiRatio, 2)} for every real invested.`,
      ),
    };
  }

  return {
    // fallback: nenhum branch local reconheceu o tema. Marcado para o Copilot tentar o
    // Gemini (que tem o contexto completo) antes de mostrar estes botões de esclarecimento.
    fallback: true,
    text: pick(
      'Não tenho certeza do que você quis dizer. Escolha um tema abaixo ou reformule a pergunta:',
      'I am not sure what you meant. Pick a topic below or rephrase your question:',
    ),
    quickReplies: [
      { label: txt('Turnover'), prompt: 'tabela de turnover por diretoria' },
      { label: txt('Absenteísmo'), prompt: 'tabela de absenteísmo por gestor' },
      { label: txt('Headcount'), prompt: 'tabela de headcount por diretoria' },
      { label: txt('Horas extras'), prompt: 'tabela de horas extras por diretoria' },
      { label: txt('Atestados'), prompt: 'tabela de atestados por CID' },
      { label: txt('Risco de saída'), prompt: 'quais diretorias apresentam maior risco' },
    ],
  };
}

export { SUGGESTED_PROMPTS };
