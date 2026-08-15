import { formatCurrency, formatNumber, formatPercent } from '../../utils/format.js';

export function formatByType(value, format, lang = 'pt') {
  switch (format) {
    case 'currency':
      return formatCurrency(value, { compact: true });
    case 'percent':
      return formatPercent(value);
    case 'days':
      return `${formatNumber(value, 0)} ${lang === 'en' ? 'days' : 'dias'}`;
    case 'years':
      return `${formatNumber(value, 1)} ${lang === 'en' ? 'years' : 'anos'}`;
    default:
      return formatNumber(value);
  }
}
