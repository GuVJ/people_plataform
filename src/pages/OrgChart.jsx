import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import { buildOrgTree } from '../data/orgChart.js';
import SectionCard from '../components/ui/SectionCard.jsx';
import OrgVizTree from '../components/orgchart/OrgVizTree.jsx';
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
          <p className="page-subtitle">Clique em uma área ou gestor para expandir o time — use os controles de zoom para navegar</p>
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

      <OrgVizTree company={tree.company} areas={tree.areas} />
    </div>
  );
}
