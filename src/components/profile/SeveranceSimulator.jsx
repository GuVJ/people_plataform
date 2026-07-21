import { useMemo, useState } from 'react';
import { simulateSeverance, SEVERANCE_SCENARIOS } from '../../data/severanceSimulator.js';
import { formatCurrency, formatNumber } from '../../utils/format.js';
import './SeveranceSimulator.css';

export default function SeveranceSimulator({ employee, referenceDate, privacyMode }) {
  const [scenario, setScenario] = useState('sem_justa_causa');

  // Compute every scenario up front so the three totals are visible at a glance, without
  // needing to click into each tab.
  const allResults = useMemo(
    () => SEVERANCE_SCENARIOS.map((s) => ({
      ...s,
      result: simulateSeverance({ employee, scenario: s.key, referenceDate }),
    })),
    [employee, referenceDate],
  );

  const active = allResults.find((s) => s.key === scenario);

  return (
    <div>
      <div className="severance-scenario-cards">
        {allResults.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`severance-scenario-card${s.key === scenario ? ' active' : ''}`}
            onClick={() => setScenario(s.key)}
          >
            <span className="severance-scenario-name">{s.label}</span>
            <span className={`severance-scenario-total${privacyMode ? ' privacy-blur' : ''}`}>{formatCurrency(s.result.total)}</span>
            <span className="severance-scenario-hint">{s.key === scenario ? 'Detalhado abaixo' : 'Ver detalhes'}</span>
          </button>
        ))}
      </div>

      <p className="text-secondary" style={{ fontSize: 11.5, margin: '14px 0' }}>
        {active.description}
      </p>

      <div className={`severance-list${privacyMode ? ' privacy-blur' : ''}`}>
        {active.result.components.map((c) => (
          <div className="severance-row" key={c.key}>
            <div>
              <span className="severance-row-label">{c.label}</span>
              <span className="severance-row-desc">{c.description}</span>
            </div>
            <span className={`severance-row-value${c.value === 0 ? ' zero' : ''}`}>{formatCurrency(c.value)}</span>
          </div>
        ))}
      </div>

      <div className="severance-total-row">
        <span>Custo total estimado — {active.label}</span>
        <span className={`severance-total-value${privacyMode ? ' privacy-blur' : ''}`}>{formatCurrency(active.result.total)}</span>
      </div>

      <p className="text-tertiary" style={{ fontSize: 10.5, marginTop: 10, lineHeight: 1.5 }}>
        Simulação para {formatNumber(active.result.tenureYears, 1)} anos de casa, considerando desligamento na data de hoje. Estimativa de planejamento (RH/Financeiro) — não substitui o cálculo oficial da folha de pagamento, que usa o saldo real de FGTS com juros e outras variáveis contratuais.
      </p>
    </div>
  );
}
