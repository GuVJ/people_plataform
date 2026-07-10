import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import { buildOrgTree } from '../data/orgChart.js';
import SectionCard from '../components/ui/SectionCard.jsx';
import AreaNode from '../components/orgchart/AreaNode.jsx';
import EmployeeSearch from '../components/orgchart/EmployeeSearch.jsx';
import { formatNumber } from '../utils/format.js';

export default function OrgChart() {
  const { metrics } = useData();
  const tree = useMemo(() => buildOrgTree(metrics.activeNow), [metrics.activeNow]);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Organograma</h1>
          <p className="page-subtitle">Estrutura organizacional por área — clique para expandir gestores e ver o time</p>
        </div>
        <EmployeeSearch employees={metrics.activeNow} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
        <SectionCard title="Headcount total">
          <div className="stat-big">{formatNumber(tree.company.headcount)}</div>
        </SectionCard>
        <SectionCard title="Áreas">
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

      <div>
        {tree.areas.map((area) => <AreaNode key={area.name} area={area} />)}
      </div>
    </div>
  );
}
