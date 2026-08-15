import { useState } from 'react';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import Field from './Field.jsx';
import Table from '../ui/Table.jsx';

function parseMonthInput(value) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export default function OvertimeForm() {
  const { tx } = useLang();
  const { metrics, logOvertime } = useData();
  const [funcionarioId, setFuncionarioId] = useState('');
  const [mes, setMes] = useState('');
  const [horas, setHoras] = useState('');
  const [success, setSuccess] = useState(null);
  const [recent, setRecent] = useState([]);

  const activeOptions = [...metrics.activeNow].sort((a, b) => a.name.localeCompare(b.name));

  function handleSubmit(e) {
    e.preventDefault();
    if (!funcionarioId || !mes || !horas) return;
    const employee = activeOptions.find((e2) => e2.id === Number(funcionarioId));
    logOvertime(Number(funcionarioId), { hours: Number(horas), month: parseMonthInput(mes) });
    setSuccess(`${horas}h ${tx('de hora extra registradas para')} ${employee?.name} ${tx('em')} ${mes}.`);
    setRecent((r) => [{ name: employee.name, mes, horas }, ...r].slice(0, 6));
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
        <Field label={tx('Mês de referência')} required>
          <input className="dform-input" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </Field>
        <Field label={tx('Horas extras')} required>
          <input className="dform-input" type="number" min="1" step="0.5" value={horas} onChange={(e) => setHoras(e.target.value)} />
        </Field>
      </div>

      <div className="dform-actions">
        <button type="submit" className="btn btn-primary">{tx('Registrar horas extras')}</button>
      </div>

      {success && <div className="dform-feedback dform-feedback-success">{success}</div>}

      {recent.length > 0 && (
        <div className="dform-recent">
          <p className="dform-recent-title">{tx('Registrados nesta sessão')}</p>
          <Table columns={[{ key: 'name', label: tx('Nome') }, { key: 'mes', label: tx('Mês') }, { key: 'horas', label: tx('Horas') }]} rows={recent} />
        </div>
      )}
    </form>
  );
}
