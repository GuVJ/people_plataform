import { useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { AREAS, ROLE_LEVELS, UNITS, GENDERS, RACES, BENEFITS } from '../../data/constants.js';
import Field from './Field.jsx';
import Table from '../ui/Table.jsx';
import { formatCurrency } from '../../utils/format.js';

const EMPTY = {
  nome: '', genero: '', raca: '', dataNascimento: '', pcd: 'Não', pcdTipo: '',
  area: '', cargo: '', unidade: '', gestorNome: '', salario: '', dataAdmissao: '', beneficios: [],
};

export default function EmployeeForm() {
  const { addEmployee, metrics } = useData();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(null);
  const [recent, setRecent] = useState([]);

  const managerOptions = metrics.activeNow.filter((e) => e.isLeadership).sort((a, b) => a.name.localeCompare(b.name));

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleBenefit(b) {
    setForm((f) => ({ ...f, beneficios: f.beneficios.includes(b) ? f.beneficios.filter((x) => x !== b) : [...f.beneficios, b] }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(null);
    const { employee, errors: errs } = addEmployee(form);
    if (!employee) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setSuccess(`${employee.name} cadastrado(a) com matrícula #${employee.id}.`);
    setRecent((r) => [{ id: employee.id, name: employee.name, area: employee.area, roleLevel: employee.roleLevel, salary: employee.salary }, ...r].slice(0, 6));
    setForm(EMPTY);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="dform-grid">
        <Field label="Nome completo" required>
          <input className="dform-input" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Ana Beatriz Souza" />
        </Field>
        <Field label="Gênero" required>
          <select className="dform-select" value={form.genero} onChange={(e) => set('genero', e.target.value)}>
            <option value="">Selecione…</option>
            {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.value}</option>)}
          </select>
        </Field>
        <Field label="Raça/Etnia" required>
          <select className="dform-select" value={form.raca} onChange={(e) => set('raca', e.target.value)}>
            <option value="">Selecione…</option>
            {RACES.map((r) => <option key={r.value} value={r.value}>{r.value}</option>)}
          </select>
        </Field>
        <Field label="Data de nascimento" required>
          <input className="dform-input" type="date" value={form.dataNascimento} onChange={(e) => set('dataNascimento', e.target.value)} />
        </Field>
        <Field label="PCD">
          <select className="dform-select" value={form.pcd} onChange={(e) => set('pcd', e.target.value)}>
            <option value="Não">Não</option>
            <option value="Sim">Sim</option>
          </select>
        </Field>
        <Field label="Tipo de PCD" hint="Preencher apenas se PCD = Sim">
          <input className="dform-input" value={form.pcdTipo} onChange={(e) => set('pcdTipo', e.target.value)} disabled={form.pcd !== 'Sim'} />
        </Field>
        <Field label="Área" required>
          <select className="dform-select" value={form.area} onChange={(e) => set('area', e.target.value)}>
            <option value="">Selecione…</option>
            {AREAS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Cargo" required>
          <select className="dform-select" value={form.cargo} onChange={(e) => set('cargo', e.target.value)}>
            <option value="">Selecione…</option>
            {ROLE_LEVELS.map((r) => <option key={r.level} value={r.level}>{r.level}</option>)}
          </select>
        </Field>
        <Field label="Unidade" required>
          <select className="dform-select" value={form.unidade} onChange={(e) => set('unidade', e.target.value)}>
            <option value="">Selecione…</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Gestor" hint="Opcional — apenas líderes já cadastrados aparecem aqui">
          <select className="dform-select" value={form.gestorNome} onChange={(e) => set('gestorNome', e.target.value)}>
            <option value="">A definir</option>
            {managerOptions.map((m) => <option key={m.id} value={m.name}>{m.name} · {m.area}</option>)}
          </select>
        </Field>
        <Field label="Salário (R$)" required>
          <input className="dform-input" type="number" min="0" step="100" value={form.salario} onChange={(e) => set('salario', e.target.value)} placeholder="Ex: 6500" />
        </Field>
        <Field label="Data de admissão" required>
          <input className="dform-input" type="date" value={form.dataAdmissao} onChange={(e) => set('dataAdmissao', e.target.value)} />
        </Field>
        <Field label="Benefícios" hint="Selecione os aplicáveis">
          <div className="dform-checkbox-grid">
            {BENEFITS.map((b) => (
              <label className="dform-checkbox" key={b}>
                <input type="checkbox" checked={form.beneficios.includes(b)} onChange={() => toggleBenefit(b)} />
                {b}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="dform-actions">
        <button type="submit" className="btn btn-primary">Cadastrar funcionário</button>
      </div>

      {success && <div className="dform-feedback dform-feedback-success">{success}</div>}
      {errors.length > 0 && (
        <div className="dform-feedback dform-feedback-error">
          Corrija os campos abaixo:
          <ul>{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {recent.length > 0 && (
        <div className="dform-recent">
          <p className="dform-recent-title">Cadastrados nesta sessão</p>
          <Table
            columns={[
              { key: 'id', label: 'Matrícula' },
              { key: 'name', label: 'Nome' },
              { key: 'area', label: 'Área' },
              { key: 'roleLevel', label: 'Cargo' },
              { key: 'salary', label: 'Salário', align: 'right', render: (r) => formatCurrency(r.salary) },
            ]}
            rows={recent}
          />
        </div>
      )}
    </form>
  );
}
