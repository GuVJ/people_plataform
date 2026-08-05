import { Link } from 'react-router-dom';
import './RulesAI.css';

const FRAMEWORKS = [
  { label: 'NIST AI RMF', desc: 'Govern · Map · Measure · Manage' },
  { label: 'ISO/IEC 42001', desc: 'Sistema de gestão de IA (AIMS)' },
  { label: 'EU AI Act', desc: 'Obrigações por nível de risco' },
  { label: 'LGPD', desc: 'Decisão automatizada e dados pessoais' },
  { label: 'PL 2338/2023', desc: 'Marco legal de IA (Brasil), baseado em risco' },
];

const PRINCIPLES = [
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

export default function RulesAI() {
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Regras e governança da IA</h1>
          <p className="page-subtitle">Como a Íris funciona, com base nos frameworks de IA responsável usados no mercado</p>
        </div>
        <Link to="/configuracoes" className="btn btn-sm">← Configurações</Link>
      </div>

      <div className="rules-intro card">
        <p>
          As regras da <strong>Íris</strong> seguem os padrões atuais de <strong>IA responsável</strong>: os frameworks
          internacionais de governança e a regulação brasileira. Cada princípio abaixo mostra o que o mercado adota e,
          ao lado, como a Íris aplica na prática.
        </p>
        <div className="rules-frameworks">
          {FRAMEWORKS.map((f) => (
            <div className="rules-fw" key={f.label}>
              <span className="rules-fw-label">{f.label}</span>
              <span className="rules-fw-desc">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rules-grid">
        {PRINCIPLES.map((p, i) => (
          <div className="rules-card card" key={p.title}>
            <div className="rules-card-head">
              <span className="rules-card-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rules-card-tag">{p.tag}</span>
            </div>
            <h3 className="rules-card-title">{p.title}</h3>
            <p className="rules-card-market">{p.market}</p>
            <div className="rules-card-iris">
              <span className="rules-card-iris-label">Na Íris</span>
              <span>{p.iris}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="rules-foot">
        Referências: NIST AI Risk Management Framework · ISO/IEC 42001 · EU AI Act · LGPD (Lei 13.709/2018) · PL 2338/2023.
        A Íris está no menu <Link to="/copilot">Íris IA</Link>.
      </p>
    </div>
  );
}
