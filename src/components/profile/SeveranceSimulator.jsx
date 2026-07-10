import { useMemo, useState } from 'react';
import { simulateSeverance, SEVERANCE_SCENARIOS } from '../../data/severanceSimulator.js';
import { formatCurrency, formatNumber } from '../../utils/format.js';
import './SeveranceSimulator.css';

export default function SeveranceSimulator({ employee, referenceDate, privacyMode }) {
  const [scenario, setScenario] = useState('sem_justa_causa');

  const result = useMemo(
    () => simulateSeverance({ employee, scenario, referenceDate }),
    [employee, scenario, referenceDate],
  );

  return (
    <div>
      <div className="severance-tabs">
        {SEVERANCE_SCENARIOS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`severance-tab${s.key === scenario ? ' active' : ''}`}
            onClick={() => setScenario(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-secondary" style={{ fontSize: 11.5, marginBottom: 14 }}>
        {SEVERANCE_SCENARIOS.find((s) => s.key === scenario).description}
      </p>

      <div className={`severance-list${privacyMode ? ' privacy-blur' : ''}`}>
        {result.components.map((c) => (
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
        <span>Custo total estimado</span>
        <span className={`severance-total-value${privacyMode ? ' privacy-blur' : ''}`}>{formatCurrency(result.total)}</span>
      </div>

      <p className="text-tertiary" style={{ fontSize: 10.5, marginTop: 10, lineHeight: 1.5 }}>
        Simulação para {formatNumber(result.tenureYears, 1)} anos de casa, considerando desligamento na data de hoje. Estimativa de planejamento (RH/Financeiro) — não substitui o cálculo oficial da folha de pagamento, que usa o saldo real de FGTS com juros e outras variáveis contratuais.
      </p>
    </div>
  );
}
