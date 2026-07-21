import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { THEMES, THEME_BY_KEY } from '../data/themes.js';
import SectionCard from '../components/ui/SectionCard.jsx';
import './Settings.css';

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
    </div>
  );
}
