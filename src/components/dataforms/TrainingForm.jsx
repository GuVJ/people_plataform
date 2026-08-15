import { useState } from 'react';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { TRAININGS } from '../../data/constants.js';
import Field from './Field.jsx';
import Table from '../ui/Table.jsx';

export default function TrainingForm() {
  const { tx } = useLang();
  const { metrics, logTraining } = useData();
  const [funcionarioId, setFuncionarioId] = useState('');
  const [treinamento, setTreinamento] = useState('');
  const [horas, setHoras] = useState('');
  const [success, setSuccess] = useState(null);
  const [recent, setRecent] = useState([]);

  const activeOptions = [...metrics.activeNow].sort((a, b) => a.name.localeCompare(b.name));

  function handleSubmit(e) {
    e.preventDefault();
    if (!funcionarioId || !treinamento || !horas) return;
    const employee = activeOptions.find((e2) => e2.id === Number(funcionarioId));
    logTraining(Number(funcionarioId), { name: treinamento, hours: Number(horas) });
    setSuccess(`${tx('Treinamento')} "${treinamento}" ${tx('registrado para')} ${employee?.name}.`);
    setRecent((r) => [{ name: employee.name, treinamento, horas }, ...r].slice(0, 6));
    setHoras('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="dform-grid">
        <Field label={tx('Funcionário')} required>
          <select className="dform-select" value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
            <option value="">{tx('Selecione…')}</option>
            {activeOptions.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.area}</option>)}
          </select>
        </Field>
        <Field label={tx('Treinamento')} required>
          <select className="dform-select" value={treinamento} onChange={(e) => setTreinamento(e.target.value)}>
            <option value="">{tx('Selecione…')}</option>
            {TRAININGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label={tx('Horas concluídas')} required>
          <input className="dform-input" type="number" min="1" step="0.5" value={horas} onChange={(e) => setHoras(e.target.value)} />
        </Field>
      </div>

      <div className="dform-actions">
        <button type="submit" className="btn btn-primary">{tx('Registrar treinamento')}</button>
      </div>

      {success && <div className="dform-feedback dform-feedback-success">{success}</div>}

      {recent.length > 0 && (
        <div className="dform-recent">
          <p className="dform-recent-title">{tx('Registrados nesta sessão')}</p>
          <Table columns={[{ key: 'name', label: tx('Nome') }, { key: 'treinamento', label: tx('Treinamento') }, { key: 'horas', label: tx('Horas') }]} rows={recent} />
        </div>
      )}
    </form>
  );
}
