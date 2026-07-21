import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import { THEMES, resolveThemes } from '../data/themes.js';
import { sparklineForKpi } from '../utils/kpiSeries.js';
import './MyDashboard.css';

export default function MyDashboard() {
  const { metrics } = useData();
  const { privacyMode } = usePreferences();
  const { favorites } = useFavorites();

  const prioritized = useMemo(() => resolveThemes(favorites, metrics), [favorites, metrics]);
  const others = useMemo(() => {
    const favSet = new Set(favorites);
    return resolveThemes(THEMES.filter((t) => !favSet.has(t.key)).map((t) => t.key), metrics);
  }, [favorites, metrics]);

  function Card({ item, privacy }) {
    return (
      <Link to={item.route} className="mydash-card-link">
        <KpiCard kpi={item.kpi} sparklineValues={sparklineForKpi(metrics, item.kpi.key)} privacyMode={privacy} />
      </Link>
    );
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Meu Painel</h1>
          <p className="page-subtitle">
            Indicadores organizados pela sua prioridade · ajuste em <Link to="/configuracoes">Configurações</Link>
          </p>
        </div>
        <Link to="/configuracoes" className="btn btn-sm">Personalizar</Link>
      </div>

      {prioritized.length > 0 ? (
        <>
          <div className="section-title">
            <span>Prioritários</span>
            <span className="text-tertiary" style={{ fontSize: 12, fontWeight: 400 }}>na ordem que você definiu</span>
          </div>
          <div className="grid grid-cols-3 mydash-priority">
            {prioritized.map((item) => (
              <div className="mydash-priority-cell" key={item.key}>
                <span className="mydash-rank">{favorites.indexOf(item.key) + 1}</span>
                <Card item={item} privacy={privacyMode && (item.key === 'custoPessoal' || item.key === 'horasExtras')} />
              </div>
            ))}
          </div>

          {others.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 28 }}><span>Demais indicadores</span></div>
              <div className="grid grid-cols-4">
                {others.map((item) => <Card key={item.key} item={item} privacy={privacyMode && (item.key === 'custoPessoal' || item.key === 'horasExtras')} />)}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="card mydash-empty">
            <h3>Seu painel ainda não está personalizado</h3>
            <p className="text-secondary" style={{ fontSize: 13.5, marginTop: 6 }}>
              Favorite os temas mais urgentes em Configurações e eles aparecerão aqui em destaque, na ordem de prioridade que você escolher.
            </p>
            <Link to="/configuracoes" className="btn btn-primary" style={{ marginTop: 14, alignSelf: 'flex-start' }}>Escolher meus favoritos</Link>
          </div>
          <div className="section-title" style={{ marginTop: 24 }}><span>Todos os indicadores</span></div>
          <div className="grid grid-cols-4">
            {others.map((item) => <Card key={item.key} item={item} privacy={privacyMode && (item.key === 'custoPessoal' || item.key === 'horasExtras')} />)}
          </div>
        </>
      )}
    </div>
  );
}
