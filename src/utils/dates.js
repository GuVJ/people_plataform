import { MONTH_LABELS } from '../data/constants.js';

export function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(date) {
  const d = new Date(date);
  return `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

export function diffInMonths(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

export function diffInYears(a, b) {
  return diffInMonths(a, b) / 12;
}

export function diffInDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export function startOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export function lastNMonths(n, reference = new Date()) {
  const months = [];
  const ref = startOfMonth(reference);
  for (let i = n - 1; i >= 0; i--) {
    months.push(addMonths(ref, -i));
  }
  return months;
}
