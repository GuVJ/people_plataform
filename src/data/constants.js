// "Diretoria" é o rótulo usado na interface (antigo "Área"). O campo interno do dado
// continua sendo `area` para não quebrar o resto do código. Cada diretoria reporta a uma
// Vice-presidência (vp), permitindo o filtro por VP no organograma.
// Diretorias de uma montadora de veículos (dados fictícios). Estrutura industrial: manufatura
// puxa o headcount, com engenharia, qualidade, logística, comercial e corporativo ao redor.
export const AREAS = [
  { name: 'Manufatura', vp: 'VP Industrial', baseHeadcount: 720, baseSalary: 3300, turnoverBias: 1.05, overtimeBias: 1.7 },
  { name: 'Manutenção Industrial', vp: 'VP Industrial', baseHeadcount: 170, baseSalary: 4300, turnoverBias: 0.9, overtimeBias: 1.6 },
  { name: 'Qualidade', vp: 'VP Industrial', baseHeadcount: 150, baseSalary: 5200, turnoverBias: 0.8, overtimeBias: 1.1 },
  { name: 'Engenharia de Manufatura', vp: 'VP Industrial', baseHeadcount: 120, baseSalary: 8600, turnoverBias: 0.7, overtimeBias: 0.9 },
  { name: 'Logística & Supply Chain', vp: 'VP Industrial', baseHeadcount: 210, baseSalary: 4600, turnoverBias: 1.2, overtimeBias: 1.3 },
  { name: 'Engenharia de Produto', vp: 'VP de Engenharia & P&D', baseHeadcount: 180, baseSalary: 9800, turnoverBias: 0.75, overtimeBias: 0.8 },
  { name: 'Pesquisa & Desenvolvimento', vp: 'VP de Engenharia & P&D', baseHeadcount: 95, baseSalary: 10500, turnoverBias: 0.7, overtimeBias: 0.75 },
  { name: 'Comercial & Vendas', vp: 'VP Comercial & Marketing', baseHeadcount: 160, baseSalary: 6500, turnoverBias: 1.5, overtimeBias: 1.0 },
  { name: 'Pós-vendas & Assistência', vp: 'VP Comercial & Marketing', baseHeadcount: 120, baseSalary: 4800, turnoverBias: 1.4, overtimeBias: 1.1 },
  { name: 'Marketing', vp: 'VP Comercial & Marketing', baseHeadcount: 65, baseSalary: 7200, turnoverBias: 1.0, overtimeBias: 0.8 },
  { name: 'Compras (Suprimentos)', vp: 'VP Corporativo', baseHeadcount: 85, baseSalary: 7800, turnoverBias: 0.7, overtimeBias: 0.8 },
  { name: 'Financeiro', vp: 'VP Corporativo', baseHeadcount: 90, baseSalary: 7600, turnoverBias: 0.7, overtimeBias: 1.1 },
  { name: 'Recursos Humanos', vp: 'VP Corporativo', baseHeadcount: 70, baseSalary: 6800, turnoverBias: 0.6, overtimeBias: 0.7 },
  { name: 'Tecnologia da Informação', vp: 'VP Corporativo', baseHeadcount: 110, baseSalary: 9500, turnoverBias: 0.9, overtimeBias: 0.8 },
  { name: 'Jurídico', vp: 'VP Corporativo', baseHeadcount: 35, baseSalary: 11200, turnoverBias: 0.4, overtimeBias: 0.6 },
];

// Vice-presidências, na ordem de exibição. Derivadas do mapa acima.
export const VPS = ['VP Industrial', 'VP de Engenharia & P&D', 'VP Comercial & Marketing', 'VP Corporativo'];

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
  { level: 'Aprendiz', weight: 5, salaryMult: 0.35, ageRange: [18, 22] },
  { level: 'Operador de Produção', weight: 30, salaryMult: 0.8, ageRange: [19, 48] },
  { level: 'Técnico', weight: 16, salaryMult: 1.05, ageRange: [21, 50] },
  { level: 'Analista', weight: 13, salaryMult: 1.2, ageRange: [23, 44] },
  { level: 'Engenheiro', weight: 11, salaryMult: 1.7, ageRange: [25, 50] },
  { level: 'Especialista', weight: 6, salaryMult: 2.0, ageRange: [30, 54] },
  { level: 'Supervisor', weight: 8, salaryMult: 1.9, ageRange: [30, 55] },
  { level: 'Coordenador', weight: 6, salaryMult: 2.5, ageRange: [33, 56] },
  { level: 'Gerente', weight: 3.5, salaryMult: 3.6, ageRange: [36, 58] },
  { level: 'Diretor', weight: 1.2, salaryMult: 5.8, ageRange: [40, 61] },
  { level: 'C-Level', weight: 0.4, salaryMult: 8.5, ageRange: [42, 63] },
];

export const LEADERSHIP_LEVELS = new Set(['Supervisor', 'Coordenador', 'Gerente', 'Diretor', 'C-Level']);

// Plantas e unidades (cidades com polo automotivo no Brasil) — empresa fictícia.
export const UNITS = [
  'São Bernardo do Campo - SP', 'Taubaté - SP', 'São José dos Pinhais - PR',
  'São Carlos - SP (Motores)', 'Vinhedo - SP (CD)', 'Sede Corporativa - SP', 'Remoto',
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
  'Sistema de Produção Enxuta (Lean)', 'IATF 16949 — Qualidade Automotiva', 'Green Belt Six Sigma',
  'Segurança NR-12 (Máquinas)', 'NR-35 — Trabalho em Altura', 'Kaizen e Melhoria Contínua',
  'Solda e Processos de União', 'Automação e CLP', 'Metrologia e Controle Dimensional', 'Liderança de Chão de Fábrica',
];

export const BENEFITS = ['PLR', 'Vale Alimentação', 'Transporte Fretado', 'Plano de Saúde', 'Plano Odontológico', 'Refeitório na Planta', 'Previdência Privada', 'Auxílio Creche', 'Gympass', 'Compra de Veículo com Desconto'];

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
