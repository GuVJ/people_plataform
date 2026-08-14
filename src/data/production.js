import { createRng } from './rng.js';

// Simulação de uma linha de montagem de veículos, derivada de forma determinística do quadro
// ativo de chão de fábrica (operadores/técnicos/aprendizes da Manufatura). Modelo clássico de
// linha balanceada + teoria das restrições:
//
//   - Cada estação tem um "conteúdo de trabalho" Wi (pessoa-segundos de mão de obra por veículo).
//   - Com Pi operadores presentes, a cadência da estação é Ci = Wi / Pi  (s/veículo).
//   - A capacidade da estação é 3600/Ci veículos/hora.
//   - O GARGALO é a estação de maior Ci (menor capacidade) — ela dita o ritmo de toda a linha.
//   - Takt time = tempo disponível / demanda. Se Ci > takt, a estação não acompanha a demanda.
//   - Faltas reduzem Pi → aumentam Ci → podem criar um novo gargalo (é o que a tela analisa).
//
// Referências de mercado: OEE (Disponibilidade × Performance × Qualidade), Andon (verde/
// amarelo/vermelho por estação) e line balancing.

// Estações do fluxo, na ordem física da linha. `weight` = fração da mão de obra alocada;
// `imbalance` = desbalanceamento estrutural (>1 = estação naturalmente mais apertada, candidata
// a gargalo mesmo com todo mundo presente; <1 = estação folgada, muito automatizada).
export const STATIONS_DEF = [
  { id: 'estamparia', name: 'Estamparia', short: 'Estamp.', icon: '🔩', weight: 0.08, imbalance: 0.86, desc: 'Prensas conformam as chapas de aço nas peças da carroceria.' },
  { id: 'carroceria', name: 'Funilaria / Carroceria', short: 'Carroc.', icon: '🔧', weight: 0.16, imbalance: 0.95, desc: 'Solda e união das peças estampadas — nasce a estrutura (body-in-white).' },
  { id: 'pintura', name: 'Pintura', short: 'Pintura', icon: '🎨', weight: 0.14, imbalance: 0.92, desc: 'Tratamento anticorrosivo, primer, cor e verniz em cabines controladas.' },
  { id: 'powertrain', name: 'Powertrain / Motores', short: 'Powertr.', icon: '⚙️', weight: 0.15, imbalance: 0.97, desc: 'Montagem e casamento de motor, câmbio e conjunto de tração.' },
  { id: 'montagem', name: 'Montagem Final', short: 'Mont.', icon: '🚗', weight: 0.28, imbalance: 1.07, desc: 'Trim: interior, elétrica, vidros, rodas — a etapa mais intensiva em mão de obra.' },
  { id: 'acabamento', name: 'Acabamento & Testes', short: 'Acab.', icon: '🛠️', weight: 0.12, imbalance: 0.99, desc: 'Fluidos, calibragem, alinhamento e testes de rodagem e estanqueidade.' },
  { id: 'inspecao', name: 'Inspeção Final', short: 'Inspeç.', icon: '✅', weight: 0.07, imbalance: 0.88, desc: 'Auditoria de qualidade e liberação do veículo (portão de qualidade).' },
];

// Diretorias/cargos considerados "chão de fábrica" (a tripulação da linha).
const LINE_AREAS = new Set(['Manufatura']);
const LINE_ROLES = new Set(['Operador de Produção', 'Técnico', 'Aprendiz']);

// Parâmetros do turno.
const SHIFTS = 2;
const NET_HOURS_PER_SHIFT = 7.5; // horas produtivas líquidas por turno (descontadas pausas)
const AVAILABLE_HOURS_DAY = SHIFTS * NET_HOURS_PER_SHIFT; // 15h produtivas/dia
const DEMAND_PER_DAY = 300; // meta de produção (veículos/dia)
const AVAILABILITY = 0.91; // disponibilidade da linha (paradas de máquina, setups) — para o OEE
const QUALITY_FPY = 0.965; // First Pass Yield — qualidade de primeira passada

const STATUS = {
  ok: { key: 'ok', label: 'No ritmo', color: 'var(--color-success)' },
  atencao: { key: 'atencao', label: 'Atenção', color: 'var(--color-warning)' },
  gargalo: { key: 'gargalo', label: 'Gargalo', color: 'var(--color-danger)' },
};

function round(v, d = 0) { const f = 10 ** d; return Math.round(v * f) / f; }

// Recalcula cadência/capacidade/status de cada estação a partir do nº de presentes, dado o takt.
// Puro — usado tanto no estado atual quanto no simulador de faltas.
export function recomputeStations(stations, takt) {
  // Cadência de cada estação e identificação do gargalo (maior Ci).
  const withCycle = stations.map((s) => {
    const present = Math.max(0, s.present);
    // Sem ninguém presente a estação para (cadência infinita) — trava a linha.
    const cycle = present > 0 ? s.workContent / present : Infinity;
    const capacity = present > 0 ? 3600 / cycle : 0; // veículos/hora
    // Folga: quantas faltas ADICIONAIS a estação aguenta antes de Ci ultrapassar o takt.
    const minPresentForTakt = s.workContent / takt; // presentes p/ Ci = takt
    const buffer = Math.floor(present - minPresentForTakt);
    return { ...s, present, cycle, capacity, buffer };
  });

  const maxCycle = Math.max(...withCycle.map((s) => (Number.isFinite(s.cycle) ? s.cycle : Number.MAX_VALUE)));
  const lineCycle = maxCycle; // s/veículo real da linha (ditado pelo gargalo)
  const lineCapacity = lineCycle > 0 ? 3600 / lineCycle : 0; // veículos/hora
  const carsDay = Math.round(lineCapacity * AVAILABLE_HOURS_DAY * AVAILABILITY);

  const finalStations = withCycle.map((s) => {
    const isBottleneck = s.cycle === maxCycle;
    let status;
    if (!Number.isFinite(s.cycle) || s.cycle > takt) status = STATUS.gargalo;
    else if (s.cycle > takt * 0.93) status = STATUS.atencao;
    else status = STATUS.ok;
    // Se é o gargalo da linha e está estourando o takt, força vermelho.
    if (isBottleneck && s.cycle > takt) status = STATUS.gargalo;
    return { ...s, isBottleneck, status: status.key, statusLabel: status.label, statusColor: status.color };
  });

  const bottleneck = finalStations.find((s) => s.cycle === maxCycle) ?? finalStations[0];
  const performance = Math.min(1, takt / lineCycle); // takt/cadência real (≤1)
  const oee = AVAILABILITY * performance * QUALITY_FPY;

  return {
    stations: finalStations,
    bottleneck,
    lineCycle: round(lineCycle, 1),
    lineCapacity: round(lineCapacity, 1),
    carsDay,
    performance,
    oee,
  };
}

export function buildProduction(employees, referenceDate) {
  const rng = createRng(430915);

  // Tripulação da linha: operadores/técnicos/aprendizes ativos da Manufatura.
  const crew = employees.filter(
    (e) => e.status === 'Ativo' && LINE_AREAS.has(e.area) && LINE_ROLES.has(e.roleLevel),
  );
  const headcountLine = crew.length || 1;

  // Taxa de falta diária ≈ dias de atestado/mês ÷ dias úteis. Chão de fábrica ~6–7%.
  const DAILY_ABSENCE_RATE = 0.065;

  // Aloca cada pessoa a uma estação (proporcional ao weight) e sorteia quem faltou hoje.
  // Alocação por identidade permite listar quem faltou (com link para a ficha).
  const buckets = Object.fromEntries(STATIONS_DEF.map((s) => [s.id, []]));
  const totalWeight = STATIONS_DEF.reduce((sum, s) => sum + s.weight, 0);
  // Vetor cumulativo de fronteiras para distribuir proporcionalmente.
  let acc = 0;
  const bounds = STATIONS_DEF.map((s) => { acc += s.weight / totalWeight; return { id: s.id, upto: acc }; });

  crew.forEach((e, i) => {
    const t = (i + 0.5) / headcountLine; // posição determinística no intervalo [0,1)
    const target = bounds.find((b) => t <= b.upto) ?? bounds[bounds.length - 1];
    const absentToday = rng() < DAILY_ABSENCE_RATE;
    buckets[target.id].push({ id: e.id, name: e.name, roleLevel: e.roleLevel, unit: e.unit, absentToday });
  });

  const totalAssigned = crew.length;
  const totalAbsent = Object.values(buckets).reduce((s, arr) => s + arr.filter((p) => p.absentToday).length, 0);
  const totalPresent = totalAssigned - totalAbsent;

  // Takt time = tempo disponível / demanda.
  const takt = (AVAILABLE_HOURS_DAY * 3600) / DEMAND_PER_DAY; // s/veículo

  // Monta as estações com conteúdo de trabalho Wi calibrado pelo quadro alocado e pelo
  // desbalanceamento estrutural (Wi = alocados × takt × imbalance → em quadro cheio,
  // Ci = takt × imbalance, então imbalance>1 já é o gargalo estrutural da linha).
  const baseStations = STATIONS_DEF.map((def) => {
    const people = buckets[def.id];
    const assigned = people.length;
    const absent = people.filter((p) => p.absentToday).length;
    const present = assigned - absent;
    const workContent = assigned * takt * def.imbalance; // pessoa-segundos por veículo
    return {
      ...def,
      assigned,
      absent,
      present,
      workContent,
      absentList: people.filter((p) => p.absentToday),
    };
  });

  const computed = recomputeStations(baseStations, takt);

  // Estação estruturalmente mais apertada (maior imbalance) — o gargalo "de projeto".
  const structuralBottleneck = [...STATIONS_DEF].sort((a, b) => b.imbalance - a.imbalance)[0];

  return {
    referenceDate,
    takt: round(takt, 0),
    demandPerDay: DEMAND_PER_DAY,
    availableHoursDay: AVAILABLE_HOURS_DAY,
    shifts: SHIFTS,
    availability: AVAILABILITY,
    quality: QUALITY_FPY,
    headcountLine,
    totalAssigned,
    totalPresent,
    totalAbsent,
    absenceRate: totalAssigned ? totalAbsent / totalAssigned : 0,
    structuralBottleneckId: structuralBottleneck.id,
    ...computed,
  };
}

// Simulador: aplica N faltas adicionais a uma estação e devolve o novo cenário da linha.
export function simulateExtraAbsence(production, stationId, extraAbsent) {
  const takt = production.takt;
  const stations = production.stations.map((s) => (
    s.id === stationId
      ? { ...s, present: Math.max(0, s.present - extraAbsent), absent: s.absent + extraAbsent }
      : { ...s }
  ));
  return recomputeStations(stations, takt);
}
