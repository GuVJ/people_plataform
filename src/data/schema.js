// Conceptual data model documentation. The in-memory dataset (generateEmployees.js) keeps
// everything denormalized on a single employee object for simplicity, but this describes the
// normalized shape it *represents* — the same shape a Postgres/Supabase schema would use if
// this platform were wired to a real database (see AuthContext.jsx for the same swap-in note).

export const TABLES = [
  {
    id: 'funcionarios',
    name: 'funcionarios',
    label: 'Funcionários',
    description: 'Tabela central — um registro por colaborador (ativo ou desligado). Toda métrica do sistema deriva daqui.',
    fields: [
      { name: 'id', type: 'integer', key: 'PK', description: 'Matrícula — chave primária' },
      { name: 'nome', type: 'text', description: 'Nome completo' },
      { name: 'genero', type: 'text', description: 'Feminino / Masculino / Não-binário' },
      { name: 'raca', type: 'text', description: 'Branca / Parda / Preta / Amarela / Indígena' },
      { name: 'data_nascimento', type: 'date' },
      { name: 'pcd', type: 'boolean' },
      { name: 'pcd_tipo', type: 'text', description: 'Física / Visual / Auditiva / Intelectual / Múltipla (se pcd = true)' },
      { name: 'unidade', type: 'text', description: 'Cidade/unidade de trabalho' },
      { name: 'area', type: 'text', description: 'Área/departamento' },
      { name: 'cargo', type: 'text', description: 'Nível do cargo (trilha IC ou liderança)' },
      { name: 'gestor_id', type: 'integer', key: 'FK', references: 'funcionarios.id', description: 'Auto-relacionamento — gestor direto' },
      { name: 'salario', type: 'numeric' },
      { name: 'data_admissao', type: 'date' },
      { name: 'data_desligamento', type: 'date', description: 'Nulo enquanto ativo' },
      { name: 'status', type: 'text', description: 'Ativo / Desligado' },
      { name: 'tipo_desligamento', type: 'text', description: 'Voluntário / Involuntário' },
      { name: 'motivo_desligamento', type: 'text' },
      { name: 'beneficios', type: 'text[]', description: 'Lista de benefícios ativos' },
      { name: 'saldo_ferias', type: 'integer', description: 'Dias de férias disponíveis' },
    ],
  },
  {
    id: 'avaliacoes_desempenho',
    name: 'avaliacoes_desempenho',
    label: 'Avaliações de Desempenho',
    description: 'Um registro por ciclo de avaliação — alimenta o Nine Box e o modelo de risco.',
    fields: [
      { name: 'id', type: 'integer', key: 'PK' },
      { name: 'funcionario_id', type: 'integer', key: 'FK', references: 'funcionarios.id' },
      { name: 'ciclo', type: 'text', description: 'Ex: 2026-S1' },
      { name: 'performance_score', type: 'numeric', description: '1.0 a 5.0' },
      { name: 'performance_bucket', type: 'text', description: 'Baixo / Médio / Alto' },
      { name: 'potencial', type: 'text', description: 'Baixo / Médio / Alto' },
      { name: 'promovido_no_ciclo', type: 'boolean' },
    ],
  },
  {
    id: 'treinamentos',
    name: 'treinamentos',
    label: 'Treinamentos',
    description: 'Um registro por participação em treinamento concluído.',
    fields: [
      { name: 'id', type: 'integer', key: 'PK' },
      { name: 'funcionario_id', type: 'integer', key: 'FK', references: 'funcionarios.id' },
      { name: 'nome_treinamento', type: 'text' },
      { name: 'data_conclusao', type: 'date' },
      { name: 'horas', type: 'numeric' },
    ],
  },
  {
    id: 'absenteismo',
    name: 'absenteismo',
    label: 'Absenteísmo',
    description: 'Um registro por mês/colaborador com dias perdidos e motivo predominante.',
    fields: [
      { name: 'id', type: 'integer', key: 'PK' },
      { name: 'funcionario_id', type: 'integer', key: 'FK', references: 'funcionarios.id' },
      { name: 'mes_referencia', type: 'date', description: 'Primeiro dia do mês' },
      { name: 'dias_perdidos', type: 'integer' },
      { name: 'motivo', type: 'text', description: 'Atestado médico / Falta não justificada / ...' },
    ],
  },
  {
    id: 'horas_extras',
    name: 'horas_extras',
    label: 'Horas Extras',
    description: 'Um registro por mês/colaborador com o banco de horas extras trabalhadas.',
    fields: [
      { name: 'id', type: 'integer', key: 'PK' },
      { name: 'funcionario_id', type: 'integer', key: 'FK', references: 'funcionarios.id' },
      { name: 'mes_referencia', type: 'date' },
      { name: 'horas', type: 'numeric' },
    ],
  },
  {
    id: 'pesquisa_clima',
    name: 'pesquisa_clima',
    label: 'Pesquisa de Clima',
    description: 'Resultado individual por rodada de pesquisa — base para a análise de sentimento.',
    fields: [
      { name: 'id', type: 'integer', key: 'PK' },
      { name: 'funcionario_id', type: 'integer', key: 'FK', references: 'funcionarios.id' },
      { name: 'data_rodada', type: 'date' },
      { name: 'score', type: 'numeric', description: '1.0 a 5.0' },
      { name: 'score_engajamento', type: 'numeric', description: '0 a 100' },
    ],
  },
];

export const RELATIONSHIPS = [
  { from: 'funcionarios.id', to: 'avaliacoes_desempenho.funcionario_id', label: '1 → N' },
  { from: 'funcionarios.id', to: 'treinamentos.funcionario_id', label: '1 → N' },
  { from: 'funcionarios.id', to: 'absenteismo.funcionario_id', label: '1 → N' },
  { from: 'funcionarios.id', to: 'horas_extras.funcionario_id', label: '1 → N' },
  { from: 'funcionarios.id', to: 'pesquisa_clima.funcionario_id', label: '1 → N' },
  { from: 'funcionarios.id', to: 'funcionarios.gestor_id', label: 'auto-relacionamento' },
];
