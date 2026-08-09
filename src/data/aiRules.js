// Regras e governança da Íris, estruturadas nos frameworks de IA responsável usados no mercado.
// Compartilhado entre a página dedicada (/configuracoes/ia) e a tela de Configurações.

export const AI_FRAMEWORKS = [
  { label: 'NIST AI RMF', desc: 'Govern · Map · Measure · Manage' },
  { label: 'ISO/IEC 42001', desc: 'Sistema de gestão de IA (AIMS)' },
  { label: 'EU AI Act', desc: 'Obrigações por nível de risco' },
  { label: 'LGPD', desc: 'Decisão automatizada e dados pessoais' },
  { label: 'PL 2338/2023', desc: 'Marco legal de IA (Brasil), baseado em risco' },
];

// Regras operacionais — o que a Íris faz na prática (capacidades e comportamento no chat).
export const AI_CAPABILITIES = [
  { title: 'Só usa os dados da plataforma', desc: 'Responde com base nos indicadores atuais (fictícios); nunca inventa números fora do contexto.' },
  { title: 'Dois motores de resposta', desc: 'Gemini (IA generativa) para perguntas abertas/analíticas; motor local determinístico para tabelas, listas e números exatos.' },
  { title: 'Esclarece perguntas ambíguas', desc: 'Se a pergunta for vaga ou sem sentido (ex.: "ofensores" sem dizer de qual métrica), pergunta o que você quis dizer em vez de adivinhar.' },
  { title: 'Tabelas e listas sob demanda', desc: 'Pedidos com "tabela/lista/planilha/baixar" geram uma tabela real com download em Excel (funcionários, gestores, turnover, atestados, EPI, NRs, ASO, PCD, trabalhista e mais).' },
  { title: 'Lista de funcionários completa', desc: 'Lista colaboradores (com filtro por diretoria); o nome é clicável e abre a ficha do funcionário.' },
  { title: 'Cruza e correlaciona indicadores', desc: 'Relaciona métricas (ex.: horas extras × turnover) e aponta associações — marcando que é associação, não causalidade.' },
  { title: 'Busca de pessoa por nome', desc: 'Cite o nome de um colaborador e ela abre a ficha com resumo, desempenho e risco de saída.' },
  { title: 'Quando falta o dado', desc: 'Usa a métrica mais próxima e sinaliza que é aproximação, em vez de inventar.' },
  { title: 'Tom executivo e acionável', desc: 'Responde em português, direto ao ponto, e fecha com uma recomendação quando faz sentido.' },
];

export const AI_PRINCIPLES = [
  {
    tag: 'Grounding',
    title: 'Ancoragem e precisão',
    market: 'A resposta é aterrada em dados verificáveis (RAG) e cita a fonte. A recuperação reduz — mas não elimina — a alucinação, então o número exato passa por verificação.',
    iris: 'Usa só os indicadores atuais da plataforma; o motor local devolve o valor exato e nunca inventa dados fora do contexto.',
  },
  {
    tag: 'Transparência',
    title: 'Transparência e explicabilidade',
    market: 'Deixar claro que é IA, de onde vem o dado e por que a resposta é aquela — documentado em model/system cards.',
    iris: 'Cada resposta mostra o selo do motor (Gemini ou Motor local); esta página descreve as regras; correlações são marcadas como associação, não causalidade.',
  },
  {
    tag: 'Privacidade · LGPD',
    title: 'Privacidade e proteção de dados',
    market: 'Minimização de dados, base legal e não exposição de dados pessoais. A LGPD (art. 20) exige cuidado com decisões automatizadas que afetam pessoas.',
    iris: 'Os dados aqui são 100% fictícios. Numa base real, listas nominais entrariam com anonimização, base legal e controle de acesso por perfil.',
  },
  {
    tag: 'Justiça',
    title: 'Justiça e não-discriminação',
    market: 'Monitorar e mitigar viés para evitar que o sistema reforce desigualdades (gênero, raça, idade).',
    iris: 'A plataforma tem auditoria de viés (fairness); a IA aponta disparidades para correção, sem reforçá-las nas respostas.',
  },
  {
    tag: 'Segurança',
    title: 'Segurança e guardrails',
    market: 'Camadas de proteção na entrada e saída: defesa contra prompt injection e jailbreak, e redação de dados sensíveis.',
    iris: 'Escopo restrito a indicadores de RH; as instruções do sistema ficam separadas do que o usuário digita; a IA não executa ações destrutivas nem sai do domínio.',
  },
  {
    tag: 'Supervisão humana',
    title: 'Humano no circuito (human-in-the-loop)',
    market: 'Em decisões consequentes, o humano decide. A IA recomenda e apoia — não decide sozinha em pontos de alto impacto.',
    iris: 'A Íris gera análise e recomendação; a decisão (retenção, desligamento, salário) é sempre do gestor.',
  },
  {
    tag: 'Governança',
    title: 'Responsabilização e governança',
    market: 'Papéis definidos, trilha de auditoria e um dono do sistema (NIST "Govern" / ISO 42001).',
    iris: 'As respostas são rastreáveis à fonte de dados; as regras são versionadas e há um responsável pelo comportamento da IA.',
  },
  {
    tag: 'Avaliação',
    title: 'Avaliação e monitoramento contínuo',
    market: 'Testar e monitorar qualidade, alucinação e deriva (drift) ao longo do tempo — não é "configura e esquece" (NIST "Measure/Manage").',
    iris: 'O motor local é determinístico (respostas estáveis e testáveis); as saídas do Gemini são monitoradas e podem cair no motor local quando falham.',
  },
];
