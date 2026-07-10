import { Outlet } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import { useData } from '../../context/DataContext.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const { ready } = useData();

  return (
    <div className="app-shell">
      <TopBar />
      <main>
        {ready ? <Outlet /> : (
          <div className="app-loading">
            <div className="app-loading-spinner" />
            <p>Gerando base de colaboradores e calculando indicadores…</p>
          </div>
        )}
      </main>
    </div>
  );
}
