// "Diretoria" é o rótulo usado na interface (antigo "Área"). O campo interno do dado
// continua sendo `area` para não quebrar o resto do código. Cada diretoria reporta a uma
// Vice-presidência (vp), permitindo o filtro por VP no organograma.
export const AREAS = [
  { name: 'Comercial', vp: 'VP Comercial & Marketing', baseHeadcount: 320, baseSalary: 6200, turnoverBias: 1.35, overtimeBias: 1.2 },
  { name: 'Tecnologia', vp: 'VP de Tecnologia & Produto', baseHeadcount: 260, baseSalary: 10800, turnoverBias: 0.85, overtimeBias: 0.7 },
  { name: 'Operações', vp: 'VP de Operações', baseHeadcount: 410, baseSalary: 4800, turnoverBias: 1.5, overtimeBias: 1.6 },
  { name: 'Financeiro', vp: 'VP Corporativo', baseHeadcount: 140, baseSalary: 7600, turnoverBias: 0.7, overtimeBias: 1.4 },
  { name: 'Marketing', vp: 'VP Comercial & Marketing', baseHeadcount: 95, baseSalary: 7200, turnoverBias: 1.0, overtimeBias: 0.9 },
  { name: 'Recursos Humanos', vp: 'VP Corporativo', baseHeadcount: 70, baseSalary: 6800, turnoverBias: 0.6, overtimeBias: 0.8 },
  { name: 'Atendimento ao Cliente', vp: 'VP de Operações', baseHeadcount: 230, baseSalary: 3600, turnoverBias: 1.8, overtimeBias: 1.1 },
  { name: 'Jurídico', vp: 'VP Corporativo', baseHeadcount: 45, baseSalary: 11200, turnoverBias: 0.4, overtimeBias: 0.6 },
  { name: 'Produto & Design', vp: 'VP de Tecnologia & Produto', baseHeadcount: 85, baseSalary: 9600, turnoverBias: 0.75, overtimeBias: 0.65 },
];

// Vice-presidências, na ordem de exibição. Derivadas do mapa acima.
export const VPS = ['VP de Tecnologia & Produto', 'VP Comercial & Marketing', 'VP de Operações', 'VP Corporativo'];

export const AREA_TO_VP = Object.fromEntries(AREAS.map((a) => [a.name, a.vp]));

// Composição do custo de hora extra por tipo (referências da CLT). `share` é a fração do
// custo total de HE atribuída a cada tipo — usada para decompor o custo mensal já calculado.
export const OVERTIME_COST_TYPES = [
  { key: 'he50', label: 'Hora extra 50%', share: 0.38, description: 'Horas extras em dias úteis, com adicional de 50% sobre a hora normal. É o tipo mais frequente.' },
  { key: 'noturno', label: 'Adicional noturno', share: 0.13, description: 'Trabalho entre 22h e 5h, adicional de 20%. Acumula com a hora extra quando a HE é noturna.' },
  { key: 'feriado', label: 'Feriado / HE 100%', share: 0.12, description: 'Trabalho em domingos e feriados sem folga compensatória, com adicional de 100%.' },
  { key: 'bancoHoras', label: 'Banco de horas', share: 0.10, description: 'Saldo de horas não compensado no prazo, pago com adicional de 50%.' },
  { key: 'sobreaviso', label: 'Sobreaviso', share: 0.10, description: 'Colaborador de prontidão em casa aguardando chamado, remunerado a 1/3 da hora normal.' },
  { key: 'acionamento', label: 'Acionamento do sobreaviso', share: 0.07, description: 'Quando quem está em sobreaviso é efetivamente acionado, as horas trabalhadas viram hora extra.' },
  { key: 'prontidao', label: 'Prontidão', share: 0.05, description: 'Colaborador aguardando ordens no próprio local de trabalho, remunerado a 2/3 da hora normal.' },
  { key: 'dsr', label: 'DSR sobre horas extras', share: 0.05, description: 'Reflexo das horas extras no descanso semanal remunerado — infla a folha de forma indireta.' },
];

export const ROLE_LEVELS = [
  { level: 'Estagiário', weight: 8, salaryMult: 0.35, ageRange: [19, 24] },
  { level: 'Analista Jr', weight: 22, salaryMult: 0.6, ageRange: [21, 28] },
  { level: 'Analista Pleno', weight: 24, salaryMult: 0.85, ageRange: [24, 34] },
  { level: 'Analista Sênior', weight: 16, salaryMult: 1.15, ageRange: [27, 40] },
  { level: 'Especialista', weight: 10, salaryMult: 1.45, ageRange: [28, 46] },
  { level: 'Coordenador', weight: 9, salaryMult: 1.7, ageRange: [28, 46] },
  { level: 'Gerente', weight: 7, salaryMult: 2.4, ageRange: [32, 52] },
  { level: 'Diretor', weight: 3, salaryMult: 4.2, ageRange: [38, 58] },
  { level: 'C-Level', weight: 1, salaryMult: 6.5, ageRange: [40, 62] },
];

export const LEADERSHIP_LEVELS = new Set(['Coordenador', 'Gerente', 'Diretor', 'C-Level']);

export const UNITS = [
  'São Paulo - SP', 'Rio de Janeiro - RJ', 'Belo Horizonte - MG', 'Curitiba - PR',
  'Porto Alegre - RS', 'Recife - PE', 'Remoto',
];

export const GENDERS = [
  { value: 'Feminino', weight: 49 },
  { value: 'Masculino', weight: 49 },
  { value: 'Não-binário', weight: 2 },
];

export const RACES = [
  { value: 'Branca', weight: 43 },
  { value: 'Parda', weight: 35 },
  { value: 'Preta', weight: 15 },
  { value: 'Amarela', weight: 4 },
  { value: 'Indígena', weight: 3 },
];

export const FIRST_NAMES_F = ['Ana', 'Maria', 'Juliana', 'Camila', 'Fernanda', 'Patrícia', 'Beatriz', 'Larissa', 'Aline', 'Carla', 'Débora', 'Vanessa', 'Renata', 'Priscila', 'Bruna', 'Gabriela', 'Sabrina', 'Tatiane', 'Luciana', 'Amanda'];
export const FIRST_NAMES_M = ['João', 'Pedro', 'Lucas', 'Marcos', 'Rafael', 'Bruno', 'Felipe', 'Gustavo', 'Rodrigo', 'Thiago', 'André', 'Diego', 'Eduardo', 'Fábio', 'Leonardo', 'Vinícius', 'Daniel', 'Gabriel', 'Ricardo', 'Alexandre'];
export const FIRST_NAMES_NB = ['Alex', 'Sam', 'Noah', 'Kim', 'Robin', 'Ariel'];
export const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Barbosa', 'Nascimento', 'Araújo', 'Melo', 'Cardoso'];

export const TERMINATION_REASONS_VOLUNTARY = [
  'Proposta salarial melhor', 'Insatisfação com liderança', 'Falta de plano de carreira',
  'Mudança de cidade', 'Empreendedorismo', 'Questões de saúde', 'Retorno aos estudos',
];

export const TERMINATION_REASONS_INVOLUNTARY = [
  'Baixa performance', 'Redução de quadro', 'Reestruturação de diretoria', 'Corte de custos', 'Fim de contrato/experiência',
];

export const ABSENCE_REASONS = [
  { value: 'Atestado médico', weight: 38 },
  { value: 'Problemas familiares', weight: 14 },
  { value: 'Falta não justificada', weight: 16 },
  { value: 'Consulta/exame', weight: 18 },
  { value: 'Licença maternidade/paternidade', weight: 8 },
  { value: 'Outros', weight: 6 },
];

export const RECRUITMENT_SOURCES = [
  { value: 'LinkedIn', weight: 34 },
  { value: 'Indicação interna', weight: 22 },
  { value: 'Site de vagas', weight: 18 },
  { value: 'Recrutadora/Headhunter', weight: 12 },
  { value: 'Universidades', weight: 8 },
  { value: 'Redes sociais', weight: 6 },
];

export const FUNNEL_STAGES = ['Candidatos', 'Triagem', 'Teste técnico', 'Entrevista RH', 'Entrevista gestor', 'Proposta', 'Contratado'];

export const TRAININGS = [
  'Liderança de Alta Performance', 'Excel Avançado', 'Comunicação Não-violenta', 'Segurança da Informação',
  'Vendas Consultivas', 'Power BI para Negócios', 'Gestão de Projetos Ágeis', 'Diversidade & Inclusão',
  'Atendimento ao Cliente 4.0', 'Inteligência Emocional',
];

export const BENEFITS = ['Vale Refeição', 'Vale Transporte', 'Plano de Saúde', 'Plano Odontológico', 'Gympass', 'Auxílio Home Office', 'Previdência Privada', 'Day Off Aniversário'];

export const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const MARKET_BENCHMARK = {
  turnoverMonthly: 2.6,
  turnoverAnnual: 27.5,
  absenteeismRate: 3.4,
  timeToHireDays: 34,
  overtimeCostPctPayroll: 3.1,
  engagementScore: 71,
  trainingHoursPerEmployee: 14,
};
