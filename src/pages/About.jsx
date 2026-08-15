import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { AREAS, VPS, UNITS } from '../data/constants.js';
import { formatNumber } from '../utils/format.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import './About.css';

const TIMELINE = [
  { year: '1979', title: 'Fundação', text: 'A Volttera Motors nasce em São Bernardo do Campo (SP), no coração do ABC paulista, com a primeira linha de montagem.' },
  { year: '1988', title: 'Volttera Ápice', text: 'Lançamento do hatch compacto que se tornaria o carro mais vendido da marca — 1 milhão de unidades na década seguinte.' },
  { year: '1998', title: 'Expansão para Taubaté', text: 'Nova planta no Vale do Paraíba e início das exportações para a América Latina.' },
  { year: '2009', title: 'P&D e Motores', text: 'Inauguração do Centro de Pesquisa & Desenvolvimento e da planta de motores em São Carlos (SP).' },
  { year: '2016', title: 'Planta do Paraná', text: 'Abertura da unidade de São José dos Pinhais (PR), dedicada a SUVs e picapes.' },
  { year: '2021', title: 'Volttera Íon', text: 'Primeiro veículo 100% elétrico da marca, marcando a virada para a mobilidade eletrificada.' },
  { year: '2026', title: 'People Analytics', text: 'Implantação desta plataforma de People Analytics, colocando dados de pessoas no centro das decisões industriais.' },
];

const VALUES = [
  { icon: '🦺', title: 'Segurança em primeiro lugar', text: 'Nenhum veículo vale um acidente. Cultura de segurança do trabalho em todas as plantas (NR-12, NR-35, DDS diário).' },
  { icon: '🎯', title: 'Qualidade sem concessão', text: 'Padrão IATF 16949 do chão de fábrica ao portão de qualidade. First Pass Yield acompanhado estação a estação.' },
  { icon: '🤝', title: 'Gente no centro', text: 'A linha anda no ritmo das pessoas. Desenvolvimento, polivalência e escuta ativa como base da produtividade.' },
  { icon: '⚡', title: 'Inovação que move', text: 'Da estamparia à eletrificação — engenharia própria e P&D para antecipar o futuro da mobilidade.' },
  { icon: '🌱', title: 'Sustentabilidade', text: 'Eficiência energética nas plantas e portfólio cada vez mais eletrificado, rumo à neutralidade de carbono.' },
  { icon: '📊', title: 'Decisão orientada a dados', text: 'Indicadores em tempo real e IA (Íris) apoiando gestores em segurança, produtividade e retenção.' },
];

const MODELS = [
  { name: 'Ápice', cat: 'Hatch compacto', emoji: '🚗' },
  { name: 'Corsária', cat: 'Sedan', emoji: '🚙' },
  { name: 'Terrano', cat: 'SUV', emoji: '🚐' },
  { name: 'Bravo', cat: 'Picape', emoji: '🛻' },
  { name: 'Íon', cat: '100% elétrico', emoji: '⚡' },
];

const PLANT_ROLES = {
  'São Bernardo do Campo - SP': 'Matriz · estamparia, funilaria e montagem final',
  'Taubaté - SP': 'Montagem de veículos · exportação',
  'São José dos Pinhais - PR': 'SUVs e picapes',
  'São Carlos - SP (Motores)': 'Powertrain · fábrica de motores',
  'Vinhedo - SP (CD)': 'Centro de distribuição e peças',
  'Sede Corporativa - SP': 'Áreas corporativas e P&D',
  'Remoto': 'Times administrativos em trabalho remoto',
};

export default function About() {
  const { metrics, production } = useData();
  const { tx } = useLang();
  const headcount = metrics.activeNow.length;
  const plants = UNITS.filter((u) => u !== 'Remoto');

  return (
    <div className="page fade-in about-page">
      {/* Hero */}
      <div className="about-hero">
        <div className="about-hero-badge">{tx('Empresa fictícia · dados 100% simulados')}</div>
        <div className="about-hero-brand">
          <span className="about-logo">VM</span>
          <div>
            <h1 className="about-title">Volttera Motors</h1>
            <p className="about-tagline">{tx('Engenharia que move o Brasil.')}</p>
          </div>
        </div>
        <p className="about-lead">
          {tx('A Volttera Motors é uma montadora de veículos brasileira (fictícia) fundada em 1979, com sede em São Bernardo do Campo. Produz hatches, sedans, SUVs, picapes e, mais recentemente, veículos elétricos — de plantas espalhadas por São Paulo e Paraná. Esta plataforma de People Analytics usa a Volttera como cenário para demonstrar, ponta a ponta, como dados de pessoas sustentam decisões de uma operação industrial.')}
        </p>
      </div>

      {/* Números vivos */}
      <div className="about-stats">
        <div className="about-stat">
          <span className="about-stat-value">{formatNumber(headcount)}</span>
          <span className="about-stat-label">{tx('Colaboradores ativos')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">{plants.length}</span>
          <span className="about-stat-label">{tx('Plantas e unidades')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">{VPS.length}</span>
          <span className="about-stat-label">{tx('Vice-presidências')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">{AREAS.length}</span>
          <span className="about-stat-label">{tx('Diretorias')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">~{formatNumber(production?.demandPerDay ?? 300)}</span>
          <span className="about-stat-label">{tx('Veículos/dia (meta da linha)')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">1979</span>
          <span className="about-stat-label">{tx('Fundação')}</span>
        </div>
      </div>

      {/* Missão / Visão */}
      <div className="grid grid-cols-2 about-mv">
        <div className="card about-mv-card">
          <h3>{tx('Missão')}</h3>
          <p>{tx('Projetar e fabricar veículos seguros, acessíveis e confiáveis, movendo pessoas e o desenvolvimento do país — com respeito a quem constrói cada carro.')}</p>
        </div>
        <div className="card about-mv-card">
          <h3>{tx('Visão')}</h3>
          <p>{tx('Ser a montadora brasileira referência em eficiência industrial e cuidado com as pessoas, liderando a transição para a mobilidade eletrificada até 2035.')}</p>
        </div>
      </div>

      {/* Valores */}
      <div className="section-title" style={{ marginTop: 28 }}><span>{tx('Nossos valores')}</span></div>
      <div className="grid grid-cols-3 about-values">
        {VALUES.map((v) => (
          <div className="card about-value" key={v.title}>
            <span className="about-value-icon">{v.icon}</span>
            <h4>{tx(v.title)}</h4>
            <p>{tx(v.text)}</p>
          </div>
        ))}
      </div>

      {/* Linha do tempo */}
      <div className="section-title" style={{ marginTop: 28 }}><span>{tx('Nossa história')}</span></div>
      <div className="card about-timeline">
        {TIMELINE.map((t) => (
          <div className="about-timeline-item" key={t.year}>
            <div className="about-timeline-year">{t.year}</div>
            <div className="about-timeline-dot" />
            <div className="about-timeline-content">
              <h4>{tx(t.title)}</h4>
              <p>{tx(t.text)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Portfólio */}
      <div className="section-title" style={{ marginTop: 28 }}><span>{tx('Portfólio de produtos')}</span> <span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>{tx('Modelos fictícios')}</span></div>
      <div className="about-models">
        {MODELS.map((m) => (
          <div className="card about-model" key={m.name}>
            <span className="about-model-emoji">{m.emoji}</span>
            <span className="about-model-name">Volttera {m.name}</span>
            <span className="about-model-cat">{tx(m.cat)}</span>
          </div>
        ))}
      </div>

      {/* Plantas */}
      <div className="section-title" style={{ marginTop: 28 }}><span>{tx('Plantas e unidades')}</span></div>
      <div className="card about-plants">
        {UNITS.map((u) => (
          <div className="about-plant" key={u}>
            <span className="about-plant-pin">📍</span>
            <div>
              <span className="about-plant-name">{u}</span>
              <span className="about-plant-role">{tx(PLANT_ROLES[u] ?? 'Unidade Volttera')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé / disclaimer */}
      <div className="card about-disclaimer">
        <p>
          <strong>{tx('Aviso:')}</strong>{' '}
          {tx('a Volttera Motors é uma')}{' '}
          <strong>{tx('empresa fictícia')}</strong>{' '}
          {tx('criada exclusivamente para esta demonstração de portfólio. Nomes, plantas, modelos, números e colaboradores são')}
          <strong>{tx(' 100% simulados')}</strong>{' '}
          {tx('e não representam nenhuma empresa, produto ou pessoa real. Nenhum dado é coletado ou enviado a serviços externos — tudo é gerado deterministicamente no seu navegador.')}
        </p>
        <p style={{ marginTop: 8 }}>
          {tx('Explore os indicadores no')}{' '}<Link to="/">Overview</Link>{tx(', a operação em')}{' '}<Link to="/produtividade">{tx('Produtividade da Linha')}</Link>{' '}{tx('ou converse com a')}{' '}<Link to="/copilot">Íris</Link>.
        </p>
      </div>
    </div>
  );
}
