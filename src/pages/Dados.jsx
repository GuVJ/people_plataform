import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import SchemaTable from '../components/schema/SchemaTable.jsx';
import RelationshipMap from '../components/schema/RelationshipMap.jsx';
import ExcelImportPanel from '../components/dataforms/ExcelImportPanel.jsx';
import EmployeeForm from '../components/dataforms/EmployeeForm.jsx';
import TerminationForm from '../components/dataforms/TerminationForm.jsx';
import AbsenceForm from '../components/dataforms/AbsenceForm.jsx';
import OvertimeForm from '../components/dataforms/OvertimeForm.jsx';
import TrainingForm from '../components/dataforms/TrainingForm.jsx';
import { TABLES, RELATIONSHIPS } from '../data/schema.js';
import './Dados.css';

const TABS = [
  { id: 'funcionario', label: 'Novo funcionário', component: EmployeeForm },
  { id: 'desligamento', label: 'Desligamento', component: TerminationForm },
  { id: 'absenteismo', label: 'Absenteísmo', component: AbsenceForm },
  { id: 'horas-extras', label: 'Horas extras', component: OvertimeForm },
  { id: 'treinamento', label: 'Treinamento', component: TrainingForm },
];

export default function Dados() {
  const { tx } = useLang();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const ActiveForm = TABS.find((t) => t.id === activeTab).component;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('Dados')}</h1>
          <p className="page-subtitle">{tx('Modelo de dados da plataforma e cadastro manual ou em massa por base')}</p>
        </div>
      </div>

      <div className="section-title"><span>{tx('Modelo de dados')}</span></div>
      <p className="text-secondary" style={{ fontSize: 12.5, marginBottom: 14, maxWidth: 720 }}>
        {tx('Todas as métricas do sistema derivam de')} <code>funcionarios.id</code> {tx('(a matrícula) — é a chave que conecta o cadastro do colaborador às demais bases (avaliações, treinamentos, absenteísmo, horas extras e clima).')}
      </p>
      <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
        {TABLES.map((t) => <SchemaTable key={t.id} table={t} />)}
      </div>
      <div style={{ marginBottom: 28 }}>
        <RelationshipMap relationships={RELATIONSHIPS} />
      </div>

      <div className="section-title"><span>{tx('Template de cadastro (Excel)')}</span></div>
      <div style={{ marginBottom: 28 }}>
        <SectionCard title={tx('Cadastro em massa de funcionários')}>
          <ExcelImportPanel />
        </SectionCard>
      </div>

      <div className="section-title"><span>{tx('Cadastrar dados manualmente')}</span></div>
      <SectionCard>
        <div className="dados-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`dados-tab${t.id === activeTab ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {tx(t.label)}
            </button>
          ))}
        </div>
        <div className="dados-tab-panel">
          <ActiveForm />
        </div>
      </SectionCard>
    </div>
  );
}
