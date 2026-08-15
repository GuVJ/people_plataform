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

// Nome do gestor com tratamento dos sentinelas de dados: colaboradores no topo da
// hierarquia reportam à "Diretoria" (conselho/board) e vagas de gestor podem estar
// "A definir". Traduz apenas esses rótulos; nomes de pessoas passam intactos.
export function managerLabel(name, lang) {
  if (name === 'Diretoria') return lang === 'en' ? 'Board' : 'Diretoria';
  if (name === 'A definir') return lang === 'en' ? 'To be defined' : 'A definir';
  return name;
}
