export function formatCurrency(value, { compact = false } = {}) {
  if (compact) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value, decimals = 1) {
  return `${formatNumber(value, decimals)}%`;
}

export function formatSigned(value, decimals = 1, suffix = '') {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}${suffix}`;
}

export function formatSignedCurrency(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCurrency(value, { compact: true })}`;
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
