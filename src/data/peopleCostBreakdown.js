import { formatCurrency } from '../utils/format.js';
import { pick } from '../i18n/lang.js';

// Encargos sociais sobre a folha bruta (CLT, Brasil): INSS patronal (~20%), FGTS (8%),
// 13º salário provisionado (8,33%), férias + 1/3 provisionadas (~11,1%), RAT (1–3%) e
// Sistema S (~5,8%). A soma desses componentes é comumente referenciada no mercado
// brasileiro como ~68% sobre o salário bruto — usamos essa referência como estimativa.
const ENCARGOS_RATE = 0.68;

// Custo médio mensal por colaborador de cada benefício (referência de mercado, Brasil).
const BENEFIT_MONTHLY_COST = {
  'Vale Refeição': 770,
  'Vale Transporte': 220,
  'Plano de Saúde': 450,
  'Plano Odontológico': 35,
  'Gympass': 110,
  'Auxílio Home Office': 100,
  'Previdência Privada': 150,
  'Day Off Aniversário': 0,
};

// Custo médio por contratação (divulgação de vagas, horas de recrutador/gestor, testes e
// onboarding) — referência de mercado para posições predominantemente analista/especialista.
const COST_PER_HIRE = 2800;

export function buildPeopleCostBreakdown(metrics) {
  const activeNow = metrics.activeNow;
  const grossSalaryMonthly = metrics.payrollSeries.at(-1).total;
  const encargosMonthly = grossSalaryMonthly * ENCARGOS_RATE;

  const beneficiosMonthly = activeNow.reduce(
    (sum, e) => sum + e.benefits.reduce((s, b) => s + (BENEFIT_MONTHLY_COST[b] ?? 0), 0),
    0,
  );

  const overtimeMonthly = metrics.overtimeSeries.at(-1).cost;
  const turnoverMonthlyAvg = metrics.terminationsSeries.slice(-12).reduce((s, t) => s + t.cost, 0) / 12;
  const trainingMonthlyAvg = metrics.training.trainingInvestment / 12;
  const recentHires12m = metrics.admissionsSeries.slice(-12).reduce((s, a) => s + a.total, 0);
  const recruitingMonthlyAvg = (recentHires12m * COST_PER_HIRE) / 12;

  const categories = [
    {
      key: 'salarios', label: 'Salários e ordenados', monthly: grossSalaryMonthly,
      description: pick('Remuneração bruta mensal do quadro ativo.', 'Monthly gross pay of the active workforce.'),
    },
    {
      key: 'encargos', label: 'Encargos sociais', monthly: encargosMonthly,
      description: pick(
        `INSS patronal, FGTS, 13º, férias + 1/3, RAT e Sistema S — estimado em ${(ENCARGOS_RATE * 100).toFixed(0)}% sobre o salário bruto (referência de mercado para CLT no Brasil).`,
        `Employer INSS, FGTS, 13th salary, vacation + 1/3, RAT and Sistema S — estimated at ${(ENCARGOS_RATE * 100).toFixed(0)}% of gross salary (market benchmark for CLT payroll in Brazil).`,
      ),
    },
    {
      key: 'beneficios', label: 'Benefícios', monthly: beneficiosMonthly,
      description: pick(
        'VR/VA, plano de saúde, odontológico, VT, gympass e previdência privada — calculado a partir da adesão real de cada colaborador.',
        'Meal/food vouchers, health and dental plans, transport voucher, gym benefit and private pension — computed from each employee\'s actual enrollment.',
      ),
    },
    {
      key: 'horasExtras', label: 'Horas extras', monthly: overtimeMonthly,
      description: pick('Custo do mês corrente com horas extras (1,5x hora normal).', 'Current-month cost of overtime (1.5x the normal hourly rate).'),
    },
    {
      key: 'turnover', label: 'Desligamento e reposição', monthly: turnoverMonthlyAvg,
      description: pick(
        'Média mensal do custo de rescisão, reposição e ramp-up de produtividade (últimos 12 meses).',
        'Monthly average cost of severance, replacement and productivity ramp-up (last 12 months).',
      ),
    },
    {
      key: 'treinamento', label: 'Treinamento e desenvolvimento', monthly: trainingMonthlyAvg,
      description: pick('Média mensal de investimento em capacitação do último ano.', 'Monthly average investment in training over the past year.'),
    },
    {
      key: 'recrutamento', label: 'Recrutamento e seleção', monthly: recruitingMonthlyAvg,
      description: pick(
        `Estimado em ${formatCurrency(COST_PER_HIRE)} por contratação — ${recentHires12m} contratações nos últimos 12 meses.`,
        `Estimated at ${formatCurrency(COST_PER_HIRE)} per hire — ${recentHires12m} hires in the last 12 months.`,
      ),
    },
  ];

  const total = categories.reduce((s, c) => s + c.monthly, 0);
  const withPct = categories
    .map((c) => ({ ...c, pct: total ? (c.monthly / total) * 100 : 0 }))
    .sort((a, b) => b.monthly - a.monthly);

  return { categories: withPct, totalMonthly: total, totalAnnual: total * 12, encargosRate: ENCARGOS_RATE, costPerHire: COST_PER_HIRE };
}
