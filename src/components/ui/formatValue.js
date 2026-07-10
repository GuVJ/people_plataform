import { formatCurrency, formatNumber, formatPercent } from '../../utils/format.js';

export function formatByType(value, format) {
  switch (format) {
    case 'currency':
      return formatCurrency(value, { compact: true });
    case 'percent':
      return formatPercent(value);
    case 'days':
      return `${formatNumber(value, 0)} dias`;
    case 'years':
      return `${formatNumber(value, 1)} anos`;
    default:
      return formatNumber(value);
  }
}
