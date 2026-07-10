import { createContext, useContext, useMemo, useState } from 'react';
import { useData } from './DataContext.jsx';
import { computeDefaultTargets } from '../data/budgetDefaults.js';

const STORAGE_KEY = 'pac-budget-targets';
const BudgetContext = createContext(null);

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function BudgetProvider({ children }) {
  const { ready, metrics } = useData();
  const [overrides, setOverrides] = useState(loadOverrides);

  const defaults = useMemo(() => (ready ? computeDefaultTargets(metrics) : null), [ready, metrics]);

  const targets = useMemo(() => {
    if (!defaults) return null;
    return {
      2025: { ...defaults[2025], ...(overrides[2025] ?? {}) },
      2026: { ...defaults[2026], ...(overrides[2026] ?? {}) },
    };
  }, [defaults, overrides]);

  function updateTarget(year, field, value) {
    setOverrides((prev) => {
      const next = { ...prev, [year]: { ...prev[year], [field]: value } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function resetYear(year) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[year];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <BudgetContext.Provider value={{ targets, defaults, updateTarget, resetYear }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
