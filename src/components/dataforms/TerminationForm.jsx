import { useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { TERMINATION_REASONS_VOLUNTARY, TERMINATION_REASONS_INVOLUNTARY } from '../../data/constants.js';
import Field from './Field.jsx';
import Table from '../ui/Table.jsx';

export default function TerminationForm() {
  const { metrics, terminateEmployee } = useData();
  const [funcionarioId, setFuncionarioId] = useState('');
  const [dataDesligamento, setDataDesligamento] = useState('');
  const [tipo, setTipo] = useState('Voluntário');
  const [motivo, setMotivo] = useState('');
  const [success, setSuccess] = useState(null);
  const [recent, setRecent] = useState([]);

  const activeOptions = [...metrics.activeNow].sort((a, b) => a.name.localeCompare(b.name));
  const reasonOptions = tipo === 'Voluntário' ? TERMINATION_REASONS_VOLUNTARY : TERMINATION_REASONS_INVOLUNTARY;

  function handleSubmit(e) {
    e.preventDefault();
    if (!funcionarioId || !dataDesligamento || !motivo) return;
    const employee = activeOptions.find((e2) => e2.id === Number(funcionarioId));
    terminateEmployee(Number(funcionarioId), {
      terminationDate: new Date(dataDesligamento), terminationType: tipo, terminationReason: motivo,
    });
    setSuccess(`Desligamento de ${employee?.name} registrado.`);
    setRecent((r) => [{ id: employee.id, name: employee.name, tipo, motivo, data: dataDesligamento }, ...r].slice(0, 6));
    setFuncionarioId(''); setDataDesligamento(''); setMotivo('');
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
        <Field label="Data de desligamento" required>
          <input className="dform-input" type="date" value={dataDesligamento} onChange={(e) => setDataDesligamento(e.target.value)} />
        </Field>
        <Field label="Tipo" required>
          <select className="dform-select" value={tipo} onChange={(e) => { setTipo(e.target.value); setMotivo(''); }}>
            <option value="Voluntário">Voluntário</option>
            <option value="Involuntário">Involuntário</option>
          </select>
        </Field>
        <Field label="Motivo" required>
          <select className="dform-select" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="">Selecione…</option>
            {reasonOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>

      <div className="dform-actions">
        <button type="submit" className="btn btn-primary">Registrar desligamento</button>
      </div>

      {success && <div className="dform-feedback dform-feedback-success">{success}</div>}

      {recent.length > 0 && (
        <div className="dform-recent">
          <p className="dform-recent-title">Registrados nesta sessão</p>
          <Table
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'tipo', label: 'Tipo' },
              { key: 'motivo', label: 'Motivo' },
              { key: 'data', label: 'Data' },
            ]}
            rows={recent}
          />
        </div>
      )}
    </form>
  );
}
