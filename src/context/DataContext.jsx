import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { generateEmployees } from '../data/generateEmployees.js';
import { deriveMetrics } from '../data/deriveMetrics.js';
import { buildAllForecasts } from '../data/forecast.js';
import { generateInsights } from '../data/insights.js';
import { computeRiskForEmployees } from '../data/risk.js';

const DataContext = createContext(null);

// Module-level cache: guards against StrictMode's double-invoked effect re-running
// the (relatively expensive) dataset generation twice on mount in development.
let cachedBundle = null;

export function DataProvider({ children }) {
  const [ready, setReady] = useState(!!cachedBundle);
  const [bundle, setBundle] = useState(cachedBundle);

  useEffect(() => {
    if (cachedBundle) {
      setBundle(cachedBundle);
      setReady(true);
      return;
    }
    const { employees, months, referenceDate } = generateEmployees();
    const metrics = deriveMetrics(employees, months, referenceDate);
    const forecasts = buildAllForecasts(metrics);
    const insights = generateInsights(metrics, forecasts);
    const risk = computeRiskForEmployees(metrics.activeNow, months);
    cachedBundle = { employees, metrics, forecasts, insights, risk };
    setBundle(cachedBundle);
    setReady(true);
  }, []);

  const value = useMemo(() => ({ ready, ...bundle }), [ready, bundle]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
