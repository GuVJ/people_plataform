import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { buildOrgTree } from '../data/orgChart.js';
import { VPS } from '../data/constants.js';
import SectionCard from '../components/ui/SectionCard.jsx';
import OrgVizTree from '../components/orgchart/OrgVizTree.jsx';
import EmployeeSearch from '../components/orgchart/EmployeeSearch.jsx';
import { formatNumber } from '../utils/format.js';
import './OrgChart.css';

export default function OrgChart() {
  const { metrics } = useData();
  const [vp, setVp] = useState('');
  const [nameQuery, setNameQuery] = useState('');

  const tree = useMemo(
    () => buildOrgTree(metrics.activeNow, { vp: vp || null, nameQuery }),
    [metrics.activeNow, vp, nameQuery],
  );

  const filtering = nameQuery.trim().length > 0;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Organograma</h1>
          <p className="page-subtitle">Clique em uma diretoria ou gestor para expandir o time — use os filtros e o zoom para navegar</p>
        </div>
        <EmployeeSearch employees={metrics.activeNow} />
      </div>

      <div className="orgchart-filters">
        <div className="orgchart-filter">
          <label>Vice-presidência</label>
          <select value={vp} onChange={(e) => setVp(e.target.value)}>
            <option value="">Todas as vice-presidências</option>
            {VPS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="orgchart-filter orgchart-filter-grow">
          <label>Filtrar por nome (funcionário ou gestor)</label>
          <input
            type="text"
            placeholder="Digite um nome para filtrar o organograma…"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>
        {(vp || filtering) && (
          <button type="button" className="btn btn-sm orgchart-clear" onClick={() => { setVp(''); setNameQuery(''); }}>
            Limpar filtros
          </button>
        )}
      </div>

      {filtering && (
        <p className="orgchart-match-note">
          {tree.matchCount > 0
            ? `${formatNumber(tree.matchCount)} resultado(s) para "${nameQuery.trim()}"${vp ? ` em ${vp}` : ''}.`
            : `Nenhum resultado para "${nameQuery.trim()}"${vp ? ` em ${vp}` : ''}.`}
        </p>
      )}

      <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
        <SectionCard title="Headcount total">
          <div className="stat-big">{formatNumber(tree.company.headcount)}</div>
          {vp && <p className="text-secondary" style={{ fontSize: 12 }}>em {vp}</p>}
        </SectionCard>
        <SectionCard title="Diretorias">
          <div className="stat-big">{tree.company.areaCount}</div>
        </SectionCard>
        <SectionCard title="Gestores">
          <div className="stat-big">{formatNumber(tree.spanOfControl.managerCount)}</div>
        </SectionCard>
        <SectionCard title="Span de controle médio">
          <div className="stat-big">{formatNumber(tree.spanOfControl.avg, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>máximo: {tree.spanOfControl.max} reportes diretos</p>
        </SectionCard>
      </div>

      {tree.areas.length > 0 ? (
        <OrgVizTree company={tree.company} areas={tree.areas} forceExpand={filtering} />
      ) : (
        <SectionCard>
          <p className="text-secondary" style={{ padding: 8 }}>Nenhum resultado para os filtros aplicados.</p>
        </SectionCard>
      )}
    </div>
  );
}
