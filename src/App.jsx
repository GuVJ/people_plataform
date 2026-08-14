import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { BudgetProvider } from './context/BudgetContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { TriggersProvider } from './context/TriggersContext.jsx';
import { FilterProvider } from './context/FilterContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

import Home from './pages/Home.jsx';
import Workforce from './pages/Workforce.jsx';
import Turnover from './pages/Turnover.jsx';
import Recruitment from './pages/Recruitment.jsx';
import Absenteeism from './pages/Absenteeism.jsx';
import Overtime from './pages/Overtime.jsx';
import Diversity from './pages/Diversity.jsx';
import Training from './pages/Training.jsx';
import Performance from './pages/Performance.jsx';
import Copilot from './pages/Copilot.jsx';
import Predictions from './pages/Predictions.jsx';
import Planning from './pages/Planning.jsx';
import Benchmark from './pages/Benchmark.jsx';
import Reports from './pages/Reports.jsx';
import OrgChart from './pages/OrgChart.jsx';
import EmployeeProfile from './pages/EmployeeProfile.jsx';
import EmployeeDirectory from './pages/EmployeeDirectory.jsx';
import ManagerView from './pages/ManagerView.jsx';
import Budget from './pages/Budget.jsx';
import BudgetEdit from './pages/BudgetEdit.jsx';
import Settings from './pages/Settings.jsx';
import RulesAI from './pages/RulesAI.jsx';
import MyDashboard from './pages/MyDashboard.jsx';
import MedicalLeave from './pages/MedicalLeave.jsx';
import Safety from './pages/Safety.jsx';
import Production from './pages/Production.jsx';
import SalaryPositioning from './pages/SalaryPositioning.jsx';
import Pcd from './pages/Pcd.jsx';
import Apprentices from './pages/Apprentices.jsx';
import Disciplinary from './pages/Disciplinary.jsx';
import Tickets from './pages/Tickets.jsx';
import Labor from './pages/Labor.jsx';
import Epi from './pages/Epi.jsx';
import Nrs from './pages/Nrs.jsx';
import Aso from './pages/Aso.jsx';
import Locked from './pages/Locked.jsx';

function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <DataProvider>
          <BudgetProvider>
            <FavoritesProvider>
            <TriggersProvider>
            <FilterProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/produtividade" element={<Production />} />
                  <Route path="/workforce" element={<Workforce />} />
                  <Route path="/turnover" element={<Turnover />} />
                  <Route path="/recruitment" element={<Recruitment />} />
                  <Route path="/absenteeism" element={<Absenteeism />} />
                  <Route path="/overtime" element={<Overtime />} />
                  <Route path="/diversity" element={<Diversity />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/copilot" element={<Copilot />} />
                  <Route path="/predictions" element={<Predictions />} />
                  <Route path="/planning" element={<Planning />} />
                  <Route path="/benchmark" element={<Benchmark />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/funcionarios" element={<EmployeeDirectory />} />
                  <Route path="/organograma" element={<OrgChart />} />
                  <Route path="/gestor" element={<ManagerView />} />
                  <Route path="/funcionario/:id" element={<EmployeeProfile />} />
                  <Route path="/orcamento" element={<Budget />} />
                  <Route path="/orcamento/metas" element={<BudgetEdit />} />
                  <Route path="/atestados" element={<MedicalLeave />} />
                  <Route path="/seguranca" element={<Safety />} />
                  <Route path="/posicionamento" element={<SalaryPositioning />} />
                  <Route path="/pcd" element={<Pcd />} />
                  <Route path="/aprendizes" element={<Apprentices />} />
                  <Route path="/disciplinar" element={<Disciplinary />} />
                  <Route path="/chamados" element={<Tickets />} />
                  <Route path="/trabalhista" element={<Labor />} />
                  <Route path="/epi" element={<Epi />} />
                  <Route path="/nrs" element={<Nrs />} />
                  <Route path="/aso" element={<Aso />} />
                  <Route path="/meu-painel" element={<MyDashboard />} />
                  <Route path="/configuracoes" element={<Settings />} />
                  <Route path="/configuracoes/ia" element={<RulesAI />} />
                  <Route path="/gatilhos" element={<Locked title="Gatilhos & Alertas" note="O envio de alertas e o Resumo Executivo por e-mail estão travados por enquanto e voltam em breve." />} />
                </Route>
              </Routes>
            </BrowserRouter>
            </FilterProvider>
            </TriggersProvider>
            </FavoritesProvider>
          </BudgetProvider>
        </DataProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}

export default App;
