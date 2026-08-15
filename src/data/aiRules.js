// Regras e governança da Íris, estruturadas nos frameworks de IA responsável usados no mercado.
// Compartilhado entre a página dedicada (/configuracoes/ia) e a tela de Configurações.
// Nota: estes exports são consts avaliadas no import; pick() resolve o idioma no momento
// da carga do módulo (renderiza em EN quando o app carrega em modo EN).
import { pick } from '../i18n/lang.js';

export const AI_FRAMEWORKS = [
  { label: 'NIST AI RMF', desc: 'Govern · Map · Measure · Manage' },
  { label: 'ISO/IEC 42001', desc: pick('Sistema de gestão de IA (AIMS)', 'AI management system (AIMS)') },
  { label: 'EU AI Act', desc: pick('Obrigações por nível de risco', 'Obligations by risk level') },
  { label: 'LGPD', desc: pick('Decisão automatizada e dados pessoais', 'Automated decisions and personal data') },
  { label: 'PL 2338/2023', desc: pick('Marco legal de IA (Brasil), baseado em risco', 'AI legal framework (Brazil), risk-based') },
];

// Regras operacionais — o que a Íris faz na prática (capacidades e comportamento no chat).
export const AI_CAPABILITIES = [
  {
    title: pick('Só usa os dados da plataforma', 'Uses only platform data'),
    desc: pick('Responde com base nos indicadores atuais (fictícios); nunca inventa números fora do contexto.', 'Answers based on the current (fictional) indicators; never makes up numbers outside the context.'),
  },
  {
    title: pick('Dois motores de resposta', 'Two answer engines'),
    desc: pick('Gemini (IA generativa) para perguntas abertas/analíticas; motor local determinístico para tabelas, listas e números exatos.', 'Gemini (generative AI) for open/analytical questions; a deterministic local engine for tables, lists and exact numbers.'),
  },
  {
    title: pick('Esclarece perguntas ambíguas', 'Clarifies ambiguous questions'),
    desc: pick('Se a pergunta for vaga ou sem sentido (ex.: "ofensores" sem dizer de qual métrica), pergunta o que você quis dizer em vez de adivinhar.', 'If a question is vague or unclear (e.g., "top offenders" without saying which metric), it asks what you meant instead of guessing.'),
  },
  {
    title: pick('Tabelas e listas sob demanda', 'Tables and lists on demand'),
    desc: pick('Pedidos com "tabela/lista/planilha/baixar" geram uma tabela real com download em Excel (funcionários, gestores, turnover, atestados, EPI, NRs, ASO, PCD, trabalhista e mais).', 'Requests with "table/list/spreadsheet/download" generate a real table with Excel download (employees, managers, turnover, sick notes, PPE, NRs, ASO, PwD, labor and more).'),
  },
  {
    title: pick('Lista de funcionários completa', 'Full employee list'),
    desc: pick('Lista colaboradores (com filtro por diretoria); o nome é clicável e abre a ficha do funcionário.', 'Lists employees (filterable by division); the name is clickable and opens the employee profile.'),
  },
  {
    title: pick('Cruza e correlaciona indicadores', 'Cross-references and correlates indicators'),
    desc: pick('Relaciona métricas (ex.: horas extras × turnover) e aponta associações — marcando que é associação, não causalidade.', 'Relates metrics (e.g., overtime × turnover) and points out associations — noting that these are associations, not causation.'),
  },
  {
    title: pick('Busca de pessoa por nome', 'Search a person by name'),
    desc: pick('Cite o nome de um colaborador e ela abre a ficha com resumo, desempenho e risco de saída.', "Mention an employee's name and it opens the profile with summary, performance and attrition risk."),
  },
  {
    title: pick('Quando falta o dado', 'When data is missing'),
    desc: pick('Usa a métrica mais próxima e sinaliza que é aproximação, em vez de inventar.', 'Uses the closest metric and flags it as an approximation, instead of making things up.'),
  },
  {
    title: pick('Tom executivo e acionável', 'Executive, actionable tone'),
    desc: pick('Responde em português, direto ao ponto, e fecha com uma recomendação quando faz sentido.', 'Answers in Portuguese, straight to the point, and closes with a recommendation when it makes sense.'),
  },
];

export const AI_PRINCIPLES = [
  {
    tag: 'Grounding',
    title: pick('Ancoragem e precisão', 'Grounding and accuracy'),
    market: pick('A resposta é aterrada em dados verificáveis (RAG) e cita a fonte. A recuperação reduz — mas não elimina — a alucinação, então o número exato passa por verificação.', 'The answer is grounded in verifiable data (RAG) and cites the source. Retrieval reduces — but does not eliminate — hallucination, so exact numbers go through verification.'),
    iris: pick('Usa só os indicadores atuais da plataforma; o motor local devolve o valor exato e nunca inventa dados fora do contexto.', "Uses only the platform's current indicators; the local engine returns the exact value and never invents data outside the context."),
  },
  {
    tag: pick('Transparência', 'Transparency'),
    title: pick('Transparência e explicabilidade', 'Transparency and explainability'),
    market: pick('Deixar claro que é IA, de onde vem o dado e por que a resposta é aquela — documentado em model/system cards.', 'Make clear that it is AI, where the data comes from and why the answer is what it is — documented in model/system cards.'),
    iris: pick('Cada resposta mostra o selo do motor (Gemini ou Motor local); esta página descreve as regras; correlações são marcadas como associação, não causalidade.', 'Each answer shows the engine badge (Gemini or Local engine); this page describes the rules; correlations are marked as association, not causation.'),
  },
  {
    tag: pick('Privacidade · LGPD', 'Privacy · LGPD'),
    title: pick('Privacidade e proteção de dados', 'Privacy and data protection'),
    market: pick('Minimização de dados, base legal e não exposição de dados pessoais. A LGPD (art. 20) exige cuidado com decisões automatizadas que afetam pessoas.', 'Data minimization, a legal basis and no exposure of personal data. The LGPD (art. 20) requires care with automated decisions that affect people.'),
    iris: pick('Os dados aqui são 100% fictícios. Numa base real, listas nominais entrariam com anonimização, base legal e controle de acesso por perfil.', 'The data here is 100% fictional. On a real base, named lists would come with anonymization, a legal basis and role-based access control.'),
  },
  {
    tag: pick('Justiça', 'Fairness'),
    title: pick('Justiça e não-discriminação', 'Fairness and non-discrimination'),
    market: pick('Monitorar e mitigar viés para evitar que o sistema reforce desigualdades (gênero, raça, idade).', 'Monitor and mitigate bias to prevent the system from reinforcing inequalities (gender, race, age).'),
    iris: pick('A plataforma tem auditoria de viés (fairness); a IA aponta disparidades para correção, sem reforçá-las nas respostas.', 'The platform has bias (fairness) auditing; the AI points out disparities for correction, without reinforcing them in its answers.'),
  },
  {
    tag: pick('Segurança', 'Security'),
    title: pick('Segurança e guardrails', 'Security and guardrails'),
    market: pick('Camadas de proteção na entrada e saída: defesa contra prompt injection e jailbreak, e redação de dados sensíveis.', 'Protection layers on input and output: defense against prompt injection and jailbreak, and redaction of sensitive data.'),
    iris: pick('Escopo restrito a indicadores de RH; as instruções do sistema ficam separadas do que o usuário digita; a IA não executa ações destrutivas nem sai do domínio.', 'Scope restricted to HR indicators; system instructions are kept separate from what the user types; the AI does not perform destructive actions or leave the domain.'),
  },
  {
    tag: pick('Supervisão humana', 'Human oversight'),
    title: pick('Humano no circuito (human-in-the-loop)', 'Human in the loop'),
    market: pick('Em decisões consequentes, o humano decide. A IA recomenda e apoia — não decide sozinha em pontos de alto impacto.', 'For consequential decisions, the human decides. The AI recommends and supports — it does not decide alone at high-impact points.'),
    iris: pick('A Íris gera análise e recomendação; a decisão (retenção, desligamento, salário) é sempre do gestor.', 'Íris produces analysis and recommendations; the decision (retention, termination, salary) always belongs to the manager.'),
  },
  {
    tag: pick('Governança', 'Governance'),
    title: pick('Responsabilização e governança', 'Accountability and governance'),
    market: pick('Papéis definidos, trilha de auditoria e um dono do sistema (NIST "Govern" / ISO 42001).', 'Defined roles, an audit trail and a system owner (NIST "Govern" / ISO 42001).'),
    iris: pick('As respostas são rastreáveis à fonte de dados; as regras são versionadas e há um responsável pelo comportamento da IA.', "Answers are traceable to the data source; the rules are versioned and there is someone accountable for the AI's behavior."),
  },
  {
    tag: pick('Avaliação', 'Evaluation'),
    title: pick('Avaliação e monitoramento contínuo', 'Evaluation and continuous monitoring'),
    market: pick('Testar e monitorar qualidade, alucinação e deriva (drift) ao longo do tempo — não é "configura e esquece" (NIST "Measure/Manage").', 'Test and monitor quality, hallucination and drift over time — it is not "set and forget" (NIST "Measure/Manage").'),
    iris: pick('O motor local é determinístico (respostas estáveis e testáveis); as saídas do Gemini são monitoradas e podem cair no motor local quando falham.', 'The local engine is deterministic (stable, testable answers); Gemini outputs are monitored and can fall back to the local engine when they fail.'),
  },
];
