import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { generateEmployees } from '../data/generateEmployees.js';
import { deriveMetrics } from '../data/deriveMetrics.js';
import { buildAllForecasts } from '../data/forecast.js';
import { generateInsights } from '../data/insights.js';
import { computeRiskForEmployees } from '../data/risk.js';
import { buildMedicalLeave } from '../data/medicalLeave.js';
import { buildSafety } from '../data/safety.js';
import { createEmployeeFromInput } from '../data/employeeFactory.js';
import { monthKey as toMonthKey } from '../utils/dates.js';

const DataContext = createContext(null);

// Module-level cache: guards against StrictMode's double-invoked effect re-running
// the (relatively expensive) dataset generation twice on mount in development, and
// keeps the mutable dataset (employees + generation months/reference date) alive
// across re-renders/mutations without threading it through component state.
let cachedBundle = null;
let genMonths = null;
let genReferenceDate = null;

function recompute(employees) {
  const metrics = deriveMetrics(employees, genMonths, genReferenceDate);
  const forecasts = buildAllForecasts(metrics);
  const insights = generateInsights(metrics, forecasts);
  const risk = computeRiskForEmployees(metrics.activeNow, genMonths);
  const medical = buildMedicalLeave(employees, genMonths);
  const safety = buildSafety(employees, genMonths, genReferenceDate);
  cachedBundle = { employees, metrics, forecasts, insights, risk, medical, safety };
  return cachedBundle;
}

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
    genMonths = months;
    genReferenceDate = referenceDate;
    setBundle(recompute(employees));
    setReady(true);
  }, []);

  const addEmployee = useCallback((rawInput) => {
    const { employee, errors } = createEmployeeFromInput(rawInput, { employees: cachedBundle.employees, referenceDate: genReferenceDate });
    if (!employee) return { employee: null, errors };
    const employees = [...cachedBundle.employees, employee];
    setBundle(recompute(employees));
    return { employee, errors: [] };
  }, []);

  const bulkImportEmployees = useCallback((rows) => {
    const employees = [...cachedBundle.employees];
    const added = [];
    const rowErrors = [];
    rows.forEach((row, index) => {
      const { employee, errors } = createEmployeeFromInput(row, { employees, referenceDate: genReferenceDate });
      if (employee) {
        employees.push(employee);
        added.push(employee);
      } else {
        rowErrors.push({ row: index + 2, errors }); // +2: header row + 1-based
      }
    });
    if (added.length) setBundle(recompute(employees));
    return { added, rowErrors };
  }, []);

  const terminateEmployee = useCallback((id, { terminationDate, terminationType, terminationReason }) => {
    const employees = cachedBundle.employees.map((e) => (e.id === id
      ? { ...e, status: 'Desligado', terminationDate, terminationType, terminationReason }
      : e));
    setBundle(recompute(employees));
  }, []);

  const logAbsence = useCallback((id, { days, reason, month }) => {
    const key = toMonthKey(month ?? genReferenceDate);
    const employees = cachedBundle.employees.map((e) => {
      if (e.id !== id) return e;
      const monthlyAbsence = new Map(e.monthlyAbsence);
      const existing = monthlyAbsence.get(key);
      monthlyAbsence.set(key, { days: (existing?.days ?? 0) + Number(days), reason });
      return { ...e, monthlyAbsence };
    });
    setBundle(recompute(employees));
  }, []);

  const logOvertime = useCallback((id, { hours, month }) => {
    const key = toMonthKey(month ?? genReferenceDate);
    const employees = cachedBundle.employees.map((e) => {
      if (e.id !== id) return e;
      const monthlyOvertime = new Map(e.monthlyOvertime);
      monthlyOvertime.set(key, (monthlyOvertime.get(key) ?? 0) + Number(hours));
      return { ...e, monthlyOvertime };
    });
    setBundle(recompute(employees));
  }, []);

  const logTraining = useCallback((id, { name, hours }) => {
    const employees = cachedBundle.employees.map((e) => (e.id === id
      ? { ...e, trainingsCompleted: [...e.trainingsCompleted, name], trainingHoursYear: e.trainingHoursYear + Number(hours) }
      : e));
    setBundle(recompute(employees));
  }, []);

  const value = useMemo(() => ({
    ready, ...bundle, addEmployee, bulkImportEmployees, terminateEmployee, logAbsence, logOvertime, logTraining,
  }), [ready, bundle, addEmployee, bulkImportEmployees, terminateEmployee, logAbsence, logOvertime, logTraining]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
