import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { THEMES, THEME_BY_KEY } from '../data/themes.js';
import SectionCard from '../components/ui/SectionCard.jsx';
import './Settings.css';

const IRIS_RULES = [
  { title: 'Só usa os dados da plataforma', desc: 'Responde exclusivamente com base nos indicadores atuais (fictícios). Nunca inventa números que não estejam nos dados.' },
  { title: 'Dois motores de resposta', desc: 'Gemini (IA generativa) para perguntas abertas e analíticas; e um motor local determinístico para tabelas, listas e fichas — sempre com o número exato.' },
  { title: 'Tabelas e listas sob demanda', desc: 'Pedidos com "tabela", "lista", "planilha" ou "baixar" geram uma tabela real com download em Excel. Cobre funcionários, gestores, unidades, turnover, atestados, segurança, EPI, NRs, ASO, PCD, aprendizes, disciplinar, chamados, trabalhista, posicionamento e mais.' },
  { title: 'Lista de funcionários completa', desc: 'Pode listar colaboradores (com filtro por diretoria). Mostra os primeiros na tela e exporta a base inteira no Excel.' },
  { title: 'Cruza e correlaciona indicadores', desc: 'Consegue relacionar métricas (ex.: horas extras × turnover) e apontar associações — sempre deixando claro que é associação observada, não causalidade comprovada.' },
  { title: 'Busca de pessoa', desc: 'Se você citar o nome de um colaborador, ela abre a ficha com resumo, desempenho e risco de saída.' },
  { title: 'Quando falta o dado', desc: 'Se algo não existir no contexto, usa a métrica mais próxima e sinaliza que é aproximação — em vez de inventar.' },
  { title: 'Tabelas não passam pelo Gemini', desc: 'Para não contradizer, pedidos de tabela são respondidos direto pelo motor local (selo "Motor local"), na hora.' },
  { title: 'Tom executivo e acionável', desc: 'Responde em português, direto ao ponto, e fecha com uma recomendação quando faz sentido.' },
  { title: 'Privacidade', desc: 'Aqui os dados são 100% fictícios. Numa base real, listas nominais entrariam com anonimização e controle de acesso.' },
];

function StarIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function Settings() {
  const { favorites, toggleFavorite, move, isFavorite } = useFavorites();
  const available = THEMES.filter((t) => !isFavorite(t.key));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Configurações</h1>
          <p className="page-subtitle">Favorite os temas mais urgentes e defina a ordem de prioridade — eles aparecem primeiro em <Link to="/meu-painel">Meu Painel</Link>.</p>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Temas favoritos" subtitle={favorites.length ? 'Arraste a prioridade com as setas — o topo é o mais urgente' : 'Nenhum tema favoritado ainda'}>
          {favorites.length === 0 ? (
            <p className="text-secondary" style={{ fontSize: 13 }}>Marque temas com a estrela ao lado para priorizá-los no seu painel.</p>
          ) : (
            <ol className="settings-fav-list">
              {favorites.map((key, i) => {
                const theme = THEME_BY_KEY[key];
                if (!theme) return null;
                return (
                  <li className="settings-fav-item" key={key}>
                    <span className="settings-fav-rank">{i + 1}</span>
                    <div className="settings-fav-info">
                      <span className="settings-fav-label">{theme.label}</span>
                      <span className="settings-fav-desc">{theme.group} · {theme.description}</span>
                    </div>
                    <div className="settings-fav-actions">
                      <button type="button" className="settings-move" disabled={i === 0} onClick={() => move(key, 'up')} aria-label="Subir prioridade">↑</button>
                      <button type="button" className="settings-move" disabled={i === favorites.length - 1} onClick={() => move(key, 'down')} aria-label="Descer prioridade">↓</button>
                      <button type="button" className="settings-star active" onClick={() => toggleFavorite(key)} aria-label="Remover dos favoritos"><StarIcon filled /></button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </SectionCard>

        <SectionCard title="Todos os temas" subtitle="Clique na estrela para favoritar">
          <div className="settings-all-list">
            {THEMES.map((theme) => {
              const fav = isFavorite(theme.key);
              return (
                <div className={`settings-theme-row${fav ? ' fav' : ''}`} key={theme.key}>
                  <button type="button" className={`settings-star${fav ? ' active' : ''}`} onClick={() => toggleFavorite(theme.key)} aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                    <StarIcon filled={fav} />
                  </button>
                  <div className="settings-fav-info">
                    <span className="settings-fav-label">{theme.label}</span>
                    <span className="settings-fav-desc">{theme.group} · {theme.description}</span>
                  </div>
                  <Link to={theme.route} className="settings-theme-link">abrir →</Link>
                </div>
              );
            })}
          </div>
          {available.length === 0 && <p className="text-tertiary" style={{ fontSize: 12, marginTop: 10 }}>Todos os temas já estão favoritados.</p>}
        </SectionCard>
      </div>

      <div className="section-title" style={{ marginTop: 30 }}>
        <span>Como a Íris funciona</span>
        <span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>as regras da inteligência do chat</span>
      </div>

      <SectionCard title="Regras da Íris (IA)" subtitle="O que ela pode fazer e como decide as respostas">
        <ol className="iris-rules">
          {IRIS_RULES.map((r, i) => (
            <li className="iris-rule" key={r.title}>
              <span className="iris-rule-num">{i + 1}</span>
              <div className="iris-rule-body">
                <span className="iris-rule-title">{r.title}</span>
                <span className="iris-rule-desc">{r.desc}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="iris-rules-foot">
          A Íris fica no menu <Link to="/copilot">Íris IA</Link>. Todos os dados desta plataforma são <strong>fictícios</strong>.
        </p>
      </SectionCard>
    </div>
  );
}
