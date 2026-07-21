// Catálogo de "temas" (indicadores) que o usuário pode favoritar/priorizar. Cada tema aponta
// para um KPI já calculado em metrics.kpis (via kpiKey) e para o dashboard onde ele mora.
export const THEMES = [
  { key: 'headcount', label: 'Headcount', kpiKey: 'headcount', route: '/workforce', group: 'Quadro', description: 'Tamanho do time ativo.' },
  { key: 'turnover', label: 'Turnover', kpiKey: 'turnover', route: '/turnover', group: 'Retenção', description: 'Rotatividade mensal.' },
  { key: 'desligamentos', label: 'Desligamentos', kpiKey: 'desligamentos', route: '/turnover', group: 'Retenção', description: 'Saídas no mês.' },
  { key: 'admissoes', label: 'Admissões', kpiKey: 'admissoes', route: '/recruitment', group: 'Atração', description: 'Contratações no mês.' },
  { key: 'tempoContratacao', label: 'Tempo de contratação', kpiKey: 'tempoContratacao', route: '/recruitment', group: 'Atração', description: 'Dias médios para contratar.' },
  { key: 'absenteismo', label: 'Absenteísmo', kpiKey: 'absenteismo', route: '/absenteeism', group: 'Saúde', description: 'Índice de faltas.' },
  { key: 'horasExtras', label: 'Horas extras', kpiKey: 'horasExtras', route: '/overtime', group: 'Custo', description: 'Custo mensal de horas extras.' },
  { key: 'custoPessoal', label: 'Custo de pessoal', kpiKey: 'custoPessoal', route: '/orcamento', group: 'Custo', description: 'Folha de pagamento mensal.' },
  { key: 'diversidade', label: 'Diversidade', kpiKey: 'diversidade', route: '/diversity', group: 'Cultura', description: 'Mulheres no quadro.' },
  { key: 'tempoEmpresa', label: 'Tempo de casa', kpiKey: 'tempoEmpresa', route: '/workforce', group: 'Quadro', description: 'Antiguidade média.' },
];

export const THEME_BY_KEY = Object.fromEntries(THEMES.map((t) => [t.key, t]));

// Junta cada tema ao KPI vivo (valor, delta, formato) de metrics.kpis.
export function resolveThemes(themeKeys, metrics) {
  const kpiByKey = Object.fromEntries(metrics.kpis.map((k) => [k.key, k]));
  return themeKeys
    .map((key) => {
      const theme = THEME_BY_KEY[key];
      const kpi = theme ? kpiByKey[theme.kpiKey] : null;
      return theme && kpi ? { ...theme, kpi } : null;
    })
    .filter(Boolean);
}
