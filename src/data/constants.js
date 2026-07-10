export const AREAS = [
  { name: 'Comercial', baseHeadcount: 320, baseSalary: 6200, turnoverBias: 1.35, overtimeBias: 1.2 },
  { name: 'Tecnologia', baseHeadcount: 260, baseSalary: 10800, turnoverBias: 0.85, overtimeBias: 0.7 },
  { name: 'Operações', baseHeadcount: 410, baseSalary: 4800, turnoverBias: 1.5, overtimeBias: 1.6 },
  { name: 'Financeiro', baseHeadcount: 140, baseSalary: 7600, turnoverBias: 0.7, overtimeBias: 1.4 },
  { name: 'Marketing', baseHeadcount: 95, baseSalary: 7200, turnoverBias: 1.0, overtimeBias: 0.9 },
  { name: 'Recursos Humanos', baseHeadcount: 70, baseSalary: 6800, turnoverBias: 0.6, overtimeBias: 0.8 },
  { name: 'Atendimento ao Cliente', baseHeadcount: 230, baseSalary: 3600, turnoverBias: 1.8, overtimeBias: 1.1 },
  { name: 'Jurídico', baseHeadcount: 45, baseSalary: 11200, turnoverBias: 0.4, overtimeBias: 0.6 },
  { name: 'Produto & Design', baseHeadcount: 85, baseSalary: 9600, turnoverBias: 0.75, overtimeBias: 0.65 },
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
  'Baixa performance', 'Redução de quadro', 'Reestruturação de área', 'Corte de custos', 'Fim de contrato/experiência',
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
