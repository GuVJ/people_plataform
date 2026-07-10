import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
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
import Dados from './pages/Dados.jsx';
import OrgChart from './pages/OrgChart.jsx';
import EmployeeProfile from './pages/EmployeeProfile.jsx';
import EmployeeDirectory from './pages/EmployeeDirectory.jsx';

function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
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
                <Route path="/dados" element={<Dados />} />
                <Route path="/organograma" element={<OrgChart />} />
                <Route path="/funcionario/:id" element={<EmployeeProfile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}

export default App;
