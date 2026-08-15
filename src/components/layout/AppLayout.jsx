import { Outlet } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const { ready } = useData();
  const { tx } = useLang();

  return (
    <div className="app-shell">
      <TopBar />
      <main>
        {ready ? <Outlet /> : (
          <div className="app-loading">
            <div className="app-loading-spinner" />
            <p>{tx('Gerando base de colaboradores e calculando indicadores…')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
