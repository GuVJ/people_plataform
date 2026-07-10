import { useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { ABSENCE_REASONS } from '../../data/constants.js';
import Field from './Field.jsx';
import Table from '../ui/Table.jsx';

function parseMonthInput(value) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export default function AbsenceForm() {
  const { metrics, logAbsence } = useData();
  const [funcionarioId, setFuncionarioId] = useState('');
  const [mes, setMes] = useState('');
  const [dias, setDias] = useState('');
  const [motivo, setMotivo] = useState('');
  const [success, setSuccess] = useState(null);
  const [recent, setRecent] = useState([]);

  const activeOptions = [...metrics.activeNow].sort((a, b) => a.name.localeCompare(b.name));

  function handleSubmit(e) {
    e.preventDefault();
    if (!funcionarioId || !mes || !dias || !motivo) return;
    const employee = activeOptions.find((e2) => e2.id === Number(funcionarioId));
    logAbsence(Number(funcionarioId), { days: Number(dias), reason: motivo, month: parseMonthInput(mes) });
    setSuccess(`${dias} dia(s) de ausência registrados para ${employee?.name} em ${mes}.`);
    setRecent((r) => [{ name: employee.name, mes, dias, motivo }, ...r].slice(0, 6));
    setDias(''); setMotivo('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="dform-grid">
        <Field label="Funcionário" required>
          <select className="dform-select" value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
            <option value="">Selecione…</option>
            {activeOptions.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.area}</option>)}
          </select>
        </Field>
        <Field label="Mês de referência" required>
          <input className="dform-input" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </Field>
        <Field label="Dias perdidos" required>
          <input className="dform-input" type="number" min="1" step="1" value={dias} onChange={(e) => setDias(e.target.value)} />
        </Field>
        <Field label="Motivo" required>
          <select className="dform-select" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="">Selecione…</option>
            {ABSENCE_REASONS.map((r) => <option key={r.value} value={r.value}>{r.value}</option>)}
          </select>
        </Field>
      </div>

      <div className="dform-actions">
        <button type="submit" className="btn btn-primary">Registrar absenteísmo</button>
      </div>

      {success && <div className="dform-feedback dform-feedback-success">{success}</div>}

      {recent.length > 0 && (
        <div className="dform-recent">
          <p className="dform-recent-title">Registrados nesta sessão</p>
          <Table columns={[{ key: 'name', label: 'Nome' }, { key: 'mes', label: 'Mês' }, { key: 'dias', label: 'Dias' }, { key: 'motivo', label: 'Motivo' }]} rows={recent} />
        </div>
      )}
    </form>
  );
}
