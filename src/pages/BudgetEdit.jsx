import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useBudget } from '../context/BudgetContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import { BUDGET_FIELDS } from '../data/budgetDefaults.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import './BudgetEdit.css';

function formatPreview(unit, value, tx) {
  const n = Number(value) || 0;
  if (unit === 'R$') return formatCurrency(n, { compact: true });
  if (unit === '%') return formatPercent(n);
  return `${formatNumber(n)} ${tx('pessoas')}`;
}

export default function BudgetEdit() {
  const { tx } = useLang();
  const { targets, defaults, updateTarget, resetYear } = useBudget();
  const [year, setYear] = useState(2026);
  const [savedFlash, setSavedFlash] = useState(false);

  if (!targets) return null;

  function handleChange(field, value) {
    updateTarget(year, field, value === '' ? 0 : Number(value));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  const current = targets[year];
  const isCustom = JSON.stringify(current) !== JSON.stringify(defaults[year]);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <Link to="/orcamento" className="text-secondary" style={{ fontSize: 12 }}>← {tx('Voltar ao orçamento')}</Link>
          <h1 style={{ marginTop: 6 }}>{tx('Editar metas de orçamento')}</h1>
          <p className="page-subtitle">{tx('As metas são definidas por ano e usadas nos comparativos da página de Orçamento')}</p>
        </div>
      </div>

      <SectionCard>
        <div className="budget-edit-year-tabs">
          {[2025, 2026].map((y) => (
            <button key={y} type="button" className={`budget-edit-year-tab${y === year ? ' active' : ''}`} onClick={() => setYear(y)}>{y}</button>
          ))}
          <span className="budget-edit-saved-flash" style={{ opacity: savedFlash ? 1 : 0 }}>{tx('Salvo')} ✓</span>
          <button type="button" className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => resetYear(year)} disabled={!isCustom}>
            {tx('Restaurar sugestão automática')}
          </button>
        </div>

        <div className="budget-edit-grid">
          {BUDGET_FIELDS.map((f) => (
            <div className="budget-edit-field" key={f.key}>
              <label className="budget-edit-label">{f.label}</label>
              <p className="budget-edit-hint">{f.description}</p>
              <div className="budget-edit-input-row">
                <input
                  type="number"
                  className="budget-edit-input"
                  value={current[f.key]}
                  min="0"
                  step={f.unit === '%' ? 1 : f.unit === 'R$' ? 1000 : 10}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                />
                <span className="budget-edit-unit">{f.unit}</span>
              </div>
              <p className="budget-edit-preview">{formatPreview(f.unit, current[f.key], tx)}</p>
              {defaults[year][f.key] !== current[f.key] && (
                <p className="budget-edit-default-note">{tx('Sugestão automática')}: {formatPreview(f.unit, defaults[year][f.key], tx)}</p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
