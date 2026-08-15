// EPI (Equipamento de Proteção Individual) exigido por função.
// Regra: apenas áreas operacionais (chão de fábrica, manutenção, logística, oficina)
// exigem EPI. Cargos administrativos em áreas operacionais recebem o kit básico de
// circulação; a alta liderança corporativa não recebe EPI individual; e áreas
// puramente administrativas (Financeiro, RH, TI, Jurídico, Comercial, etc.) não têm EPI.
// A situação de cada EPI (entregue / a vencer / vencido / pendente) é derivada de forma
// determinística do id do colaborador, para ser estável entre renders sem persistência.

// Catálogo (mesmos itens do dashboard de EPI em hrExtras.js). O texto é a língua-fonte (PT);
// a tradução vive em src/i18n/dict/epi.js e é aplicada no componente via tx().
const EPI_CATALOG = {
  capacete: 'Capacete',
  luva: 'Luvas',
  botina: 'Botina de segurança',
  oculos: 'Óculos de proteção',
  auricular: 'Protetor auricular',
  mascara: 'Máscara/respirador',
  cinto: 'Cinto de segurança',
  facial: 'Protetor facial',
};

// EPI exigido por área operacional (conjunto completo, aplicado a cargos de chão de fábrica).
const EPI_BY_AREA = {
  'Manufatura': ['botina', 'oculos', 'auricular', 'luva', 'mascara'],
  'Manutenção Industrial': ['botina', 'oculos', 'luva', 'auricular', 'capacete', 'cinto'],
  'Qualidade': ['botina', 'oculos', 'auricular'],
  'Engenharia de Manufatura': ['botina', 'oculos', 'auricular'],
  'Logística & Supply Chain': ['botina', 'oculos', 'luva', 'auricular'],
  'Pós-vendas & Assistência': ['botina', 'oculos', 'luva'],
};

// Cargos de chão de fábrica: recebem o conjunto completo da área.
const FLOOR_ROLES = new Set(['Operador de Produção', 'Técnico', 'Aprendiz', 'Supervisor']);
// Alta liderança corporativa: não recebe EPI individual mesmo em área operacional.
const EXEMPT_ROLES = new Set(['Diretor', 'C-Level']);
// Kit básico para quem circula na fábrica em função técnica/gestão (não operacional).
const VISITOR_BASE = ['botina', 'oculos'];

// A função precisa de EPI? (área operacional e cargo não isento)
export function requiresEpi(employee) {
  if (!employee) return false;
  if (EXEMPT_ROLES.has(employee.roleLevel)) return false;
  return Boolean(EPI_BY_AREA[employee.area]);
}

// Quais chaves de EPI a função exige.
function requiredKeysFor(employee) {
  const areaSet = EPI_BY_AREA[employee.area];
  if (!areaSet) return [];
  if (FLOOR_ROLES.has(employee.roleLevel)) return areaSet;
  // Não-operacionais na fábrica: kit básico + protetor auricular se a área for ruidosa.
  const base = areaSet.filter((k) => VISITOR_BASE.includes(k));
  if (areaSet.includes('auricular')) base.push('auricular');
  return base;
}

// Hash determinístico (djb2) — mesma entrada, mesma saída, sem depender de Date/Math.random.
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// Situações possíveis. `has` = o colaborador possui o EPI válido em mãos.
export const EPI_STATUS = {
  ok: { key: 'ok', label: 'Entregue e em dia', has: true, tone: 'success' },
  expiring: { key: 'expiring', label: 'Troca próxima', has: true, tone: 'warning' },
  expired: { key: 'expired', label: 'Vencido (CA)', has: false, tone: 'danger' },
  missing: { key: 'missing', label: 'Pendente de entrega', has: false, tone: 'danger' },
};

// Checklist de EPI do colaborador: item, situação e detalhes determinísticos.
export function getEpiChecklist(employee) {
  const keys = requiredKeysFor(employee);
  const seedBase = String(employee?.id ?? employee?.name ?? '');
  return keys.map((key) => {
    const h = hashStr(`${seedBase}:${key}`);
    const r = h % 100;
    let statusKey;
    if (r < 78) statusKey = 'ok';
    else if (r < 90) statusKey = 'expiring';
    else if (r < 96) statusKey = 'expired';
    else statusKey = 'missing';
    const status = EPI_STATUS[statusKey];
    return {
      key,
      name: EPI_CATALOG[key],
      status: statusKey,
      statusLabel: status.label,
      tone: status.tone,
      has: status.has,
      caNumber: 10000 + (h % 29999), // nº do Certificado de Aprovação (fictício)
      lastDeliveryDaysAgo: status.has ? 5 + (h % 160) : null,
      daysToChange: statusKey === 'expiring' ? 3 + (h % 12) : null,
      expiredDaysAgo: statusKey === 'expired' ? 2 + (h % 40) : null,
    };
  });
}

// Resumo de conformidade de EPI do colaborador.
export function getEpiSummary(employee) {
  const items = getEpiChecklist(employee);
  const total = items.length;
  const compliant = items.filter((i) => i.status === 'ok').length;
  const inHand = items.filter((i) => i.has).length; // possui (em dia ou a vencer)
  const issues = items.filter((i) => !i.has).length; // não possui válido (vencido/pendente)
  return { total, compliant, inHand, issues, items };
}
