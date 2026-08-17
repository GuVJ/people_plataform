// PT -> EN da linha de produção (Produtividade da Linha).
export default {
  // Nomes das estações
  'Estamparia': 'Stamping',
  'Funilaria / Carroceria': 'Body Shop',
  'Pintura': 'Paint Shop',
  'Powertrain / Motores': 'Powertrain / Engines',
  'Montagem Final': 'Final Assembly',
  'Acabamento & Testes': 'Finishing & Testing',
  'Inspeção Final': 'Final Inspection',
  // Rótulos curtos
  'Estamp.': 'Stamp.',
  'Carroc.': 'Body',
  'Powertr.': 'Powertr.',
  'Mont.': 'Assy.',
  'Acab.': 'Finish.',
  'Inspeç.': 'Insp.',
  // Status Andon
  'No ritmo': 'On pace',
  'Atenção': 'Watch',
  'Gargalo': 'Bottleneck',
  // Tooltips (info dos KPIs)
  'OEE = Disponibilidade × Performance × Qualidade. Mede quanto da capacidade teórica da linha vira veículo bom de verdade. Referência de classe mundial: ~85%.':
    "OEE = Availability × Performance × Quality. Measures how much of the line's theoretical capacity turns into actually-good vehicles. World-class benchmark: ~85%.",
  'Quantos veículos por dia a linha entrega no ritmo atual — limitada pela estação mais lenta (gargalo) — comparada com a meta diária.':
    'How many vehicles per day the line delivers at the current pace — capped by the slowest station (bottleneck) — compared with the daily target.',
  'Tempo que a linha leva para produzir um veículo, ditado pela estação mais lenta. Se for maior que o takt, a linha não acompanha a demanda.':
    "Time the line takes to produce one vehicle, set by the slowest station. If it exceeds the takt, the line can't keep up with demand.",
  'A estação com menor capacidade: ela limita o ritmo de toda a linha (teoria das restrições).':
    'The station with the lowest capacity: it caps the pace of the whole line (theory of constraints).',
  'Total de operadores alocados nas estações da linha de montagem.':
    'Total operators assigned to the assembly-line stations.',
  'Operadores presentes hoje na produção, já descontadas as faltas.':
    'Operators present in production today, after subtracting absences.',
  'Operadores ausentes hoje e o percentual da tripulação total que isso representa.':
    'Operators absent today and the percentage of the total crew that represents.',
  'Ritmo exigido pela demanda: tempo disponível ÷ veículos a produzir. Cada veículo deve sair a cada X segundos para atender ao pedido do dia.':
    "Pace required by demand: available time ÷ vehicles to produce. Each vehicle must come off the line every X seconds to meet the day's order.",
};
