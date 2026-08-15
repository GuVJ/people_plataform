import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { buildOrgTree } from '../data/orgChart.js';
import { VPS } from '../data/constants.js';
import SectionCard from '../components/ui/SectionCard.jsx';
import OrgVizTree from '../components/orgchart/OrgVizTree.jsx';
import EmployeeSearch from '../components/orgchart/EmployeeSearch.jsx';
import { formatNumber } from '../utils/format.js';
import './OrgChart.css';

export default function OrgChart() {
  const { metrics } = useData();
  const { tx } = useLang();
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
          <h1>{tx('Organograma')}</h1>
          <p className="page-subtitle">{tx('Clique em uma diretoria ou gestor para expandir o time — use os filtros e o zoom para navegar')}</p>
        </div>
        <EmployeeSearch employees={metrics.activeNow} />
      </div>

      <div className="orgchart-filters">
        <div className="orgchart-filter">
          <label>{tx('Vice-presidência')}</label>
          <select value={vp} onChange={(e) => setVp(e.target.value)}>
            <option value="">{tx('Todas as vice-presidências')}</option>
            {VPS.map((v) => <option key={v} value={v}>{tx(v)}</option>)}
          </select>
        </div>
        <div className="orgchart-filter orgchart-filter-grow">
          <label>{tx('Filtrar por nome (funcionário ou gestor)')}</label>
          <input
            type="text"
            placeholder={tx('Digite um nome para filtrar o organograma…')}
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>
        {(vp || filtering) && (
          <button type="button" className="btn btn-sm orgchart-clear" onClick={() => { setVp(''); setNameQuery(''); }}>
            {tx('Limpar filtros')}
          </button>
        )}
      </div>

      {filtering && (
        <p className="orgchart-match-note">
          {tree.matchCount > 0
            ? `${formatNumber(tree.matchCount)} ${tx('resultado(s) para')} "${nameQuery.trim()}"${vp ? ` ${tx('em')} ${vp}` : ''}.`
            : `${tx('Nenhum resultado para')} "${nameQuery.trim()}"${vp ? ` ${tx('em')} ${vp}` : ''}.`}
        </p>
      )}

      <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
        <SectionCard title={tx('Headcount total')}>
          <div className="stat-big">{formatNumber(tree.company.headcount)}</div>
          {vp && <p className="text-secondary" style={{ fontSize: 12 }}>{tx('em')} {vp}</p>}
        </SectionCard>
        <SectionCard title={tx('Diretorias')}>
          <div className="stat-big">{tree.company.areaCount}</div>
        </SectionCard>
        <SectionCard title={tx('Gestores')}>
          <div className="stat-big">{formatNumber(tree.spanOfControl.managerCount)}</div>
        </SectionCard>
        <SectionCard title={tx('Span de controle médio')}>
          <div className="stat-big">{formatNumber(tree.spanOfControl.avg, 1)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('máximo:')} {tree.spanOfControl.max} {tx('reportes diretos')}</p>
        </SectionCard>
      </div>

      {tree.areas.length > 0 ? (
        <OrgVizTree company={tree.company} areas={tree.areas} forceExpand={filtering} />
      ) : (
        <SectionCard>
          <p className="text-secondary" style={{ padding: 8 }}>{tx('Nenhum resultado para os filtros aplicados.')}</p>
        </SectionCard>
      )}
    </div>
  );
}
