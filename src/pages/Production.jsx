import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import Table from '../components/ui/Table.jsx';
import { buildProduction, simulateExtraAbsence } from '../data/production.js';
import { formatNumber, formatPercent } from '../utils/format.js';
import './Production.css';

function statusClass(key) {
  return key === 'gargalo' ? 'prod-red' : key === 'atencao' ? 'prod-amber' : 'prod-green';
}

export default function Production() {
  const { employees, metrics } = useData();
  const prod = useMemo(() => buildProduction(employees, metrics.referenceDate), [employees, metrics.referenceDate]);

  const [simStation, setSimStation] = useState(prod.bottleneck.id);
  const [extra, setExtra] = useState(0);

  const sim = useMemo(() => simulateExtraAbsence(prod, simStation, extra), [prod, simStation, extra]);
  const simDelta = sim.carsDay - prod.carsDay;
  const simStationData = sim.stations.find((s) => s.id === simStation);

  const oeePct = Math.round(prod.oee * 100);
  const oeeBand = oeePct >= 75 ? 'prod-green' : oeePct >= 60 ? 'prod-amber' : 'prod-red';

  const tableRows = prod.stations.map((s) => ({
    ...s,
    estacao: s.name,
    cadencia: s.cycle,
    capac: s.capacity,
  }));
  const maxCapacity = Math.max(...prod.stations.map((s) => s.capacity), 1);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Produtividade da Linha</h1>
          <p className="page-subtitle">
            Linha de montagem · {prod.shifts} turnos · takt {prod.takt}s/veículo · meta {formatNumber(prod.demandPerDay)} veículos/dia (dados fictícios)
          </p>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="OEE da linha">
          <div className={`stat-big ${oeeBand}-text`}>{oeePct}%</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>Disp. {Math.round(prod.availability * 100)}% × Perf. {Math.round(prod.performance * 100)}% × Qual. {Math.round(prod.quality * 100)}%</p>
        </SectionCard>
        <SectionCard title="Produção projetada">
          <div className="stat-big">{formatNumber(prod.carsDay)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>veículos/dia · meta {formatNumber(prod.demandPerDay)} ({prod.carsDay >= prod.demandPerDay ? '✓ no alvo' : `${formatNumber(prod.demandPerDay - prod.carsDay)} abaixo`})</p>
        </SectionCard>
        <SectionCard title="Cadência real (gargalo)">
          <div className="stat-big">{formatNumber(prod.lineCycle, 0)}s</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>por veículo · takt {prod.takt}s → {prod.lineCycle > prod.takt ? 'acima do takt' : 'dentro do takt'}</p>
        </SectionCard>
        <SectionCard title="Estação gargalo">
          <div className="stat-big" style={{ fontSize: 22 }}>{prod.bottleneck.icon} {prod.bottleneck.name}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>capacidade {formatNumber(prod.bottleneck.capacity, 1)} veíc/h — limita a linha</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Pessoas na linha">
          <div className="stat-big">{formatNumber(prod.totalAssigned)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>operadores alocados nas 7 estações</p>
        </SectionCard>
        <SectionCard title="Ativas hoje">
          <div className="stat-big prod-green-text">{formatNumber(prod.totalPresent)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>presentes na produção</p>
        </SectionCard>
        <SectionCard title="Faltas hoje">
          <div className="stat-big prod-red-text">{formatNumber(prod.totalAbsent)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{formatPercent(prod.absenceRate * 100)} da tripulação</p>
        </SectionCard>
        <SectionCard title="Takt time">
          <div className="stat-big">{prod.takt}s</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>ritmo exigido pela demanda</p>
        </SectionCard>
      </div>

      {/* Fluxo Andon da linha */}
      <SectionCard title="Fluxo da linha de montagem" subtitle="Andon — verde: no ritmo · amarelo: atenção · vermelho: gargalo. Cada estação mostra presentes/postos e capacidade.">
        <div className="prod-flow">
          {prod.stations.map((s, i) => (
            <div className="prod-flow-item" key={s.id}>
              <div className={`prod-station ${statusClass(s.status)}${s.isBottleneck ? ' prod-station-bottleneck' : ''}`}>
                {s.isBottleneck && <span className="prod-bottleneck-tag">GARGALO</span>}
                <div className="prod-station-head">
                  <span className="prod-station-icon">{s.icon}</span>
                  <span className="prod-station-dot" style={{ background: s.statusColor }} />
                </div>
                <div className="prod-station-name">{s.name}</div>
                <div className="prod-station-metric">
                  <span className="prod-station-present">{s.present}</span>
                  <span className="prod-station-sep">/</span>
                  <span className="prod-station-assigned">{s.assigned}</span>
                  <span className="prod-station-cap-label">presentes</span>
                </div>
                <div className="prod-station-foot">
                  <span>{formatNumber(s.capacity, 1)} veíc/h</span>
                  <span>{formatNumber(s.cycle, 0)}s</span>
                </div>
                {s.absent > 0 && <div className="prod-station-absent">−{s.absent} falta{s.absent > 1 ? 's' : ''}</div>}
              </div>
              {i < prod.stations.length - 1 && <span className="prod-arrow">→</span>}
            </div>
          ))}
        </div>
        <p className="prod-flow-out">
          🚗 Saída da linha: <strong>{formatNumber(prod.carsDay)} veículos/dia</strong> — ritmo ditado pela estação <strong>{prod.bottleneck.name}</strong> (teoria das restrições: a linha anda no passo da estação mais lenta).
        </p>
      </SectionCard>

      {/* Simulador de impacto de faltas */}
      <div style={{ marginTop: 16 }}>
        <SectionCard title="Simulador de impacto de faltas" subtitle="E se mais gente faltar? Escolha uma estação, adicione faltas e veja se um novo gargalo aparece.">
          <div className="prod-sim">
            <div className="prod-sim-controls">
              <label className="prod-sim-label">Estação</label>
              <div className="prod-sim-stations">
                {prod.stations.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`prod-sim-chip${simStation === s.id ? ' active' : ''}`}
                    onClick={() => { setSimStation(s.id); setExtra(0); }}
                  >
                    {s.icon} {s.short}
                  </button>
                ))}
              </div>

              <label className="prod-sim-label" style={{ marginTop: 14 }}>Faltas adicionais nessa estação</label>
              <div className="prod-sim-stepper">
                <button type="button" onClick={() => setExtra((n) => Math.max(0, n - 1))} disabled={extra === 0}>−</button>
                <span className="prod-sim-count">{extra}</span>
                <button type="button" onClick={() => setExtra((n) => Math.min(simStationData ? simStationData.present + extra : 50, n + 1))}>+</button>
                <div className="prod-sim-quick">
                  {[0, 5, 10, 20].map((n) => (
                    <button key={n} type="button" className={extra === n ? 'active' : ''} onClick={() => setExtra(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="prod-sim-result">
              <div className="prod-sim-result-row">
                <div className="prod-sim-kpi">
                  <span className="prod-sim-kpi-label">Produção projetada</span>
                  <span className={`prod-sim-kpi-val ${simDelta < 0 ? 'prod-red-text' : ''}`}>{formatNumber(sim.carsDay)}</span>
                  <span className="prod-sim-kpi-sub">veículos/dia</span>
                </div>
                <div className="prod-sim-kpi">
                  <span className="prod-sim-kpi-label">Variação</span>
                  <span className={`prod-sim-kpi-val ${simDelta < 0 ? 'prod-red-text' : simDelta > 0 ? 'prod-green-text' : ''}`}>
                    {simDelta > 0 ? '+' : ''}{formatNumber(simDelta)}
                  </span>
                  <span className="prod-sim-kpi-sub">vs. hoje ({formatNumber(prod.carsDay)})</span>
                </div>
                <div className="prod-sim-kpi">
                  <span className="prod-sim-kpi-label">OEE projetado</span>
                  <span className="prod-sim-kpi-val">{Math.round(sim.oee * 100)}%</span>
                  <span className="prod-sim-kpi-sub">antes: {oeePct}%</span>
                </div>
              </div>
              <p className="prod-sim-verdict">
                {(() => {
                  const newBn = sim.bottleneck;
                  if (extra === 0) return `Cenário atual: o gargalo é ${prod.bottleneck.name}. Adicione faltas para simular.`;
                  const changedBn = newBn.id !== prod.bottleneck.id;
                  const stName = simStationData?.name;
                  if (simStationData && simStationData.present <= 0) {
                    return `⛔ Com ${extra} faltas a mais, ${stName} fica sem operadores e PARA a linha — produção vai a zero até realocar gente.`;
                  }
                  if (changedBn && newBn.id === simStation) {
                    return `🔴 Com ${extra} faltas a mais, ${stName} vira o novo gargalo da linha e a produção cai para ${formatNumber(sim.carsDay)} veículos/dia (${formatNumber(simDelta)}).`;
                  }
                  if (simDelta < 0) {
                    return `🟠 ${extra} faltas a mais em ${stName} derrubam a produção em ${formatNumber(Math.abs(simDelta))} veículos/dia. Gargalo segue em ${newBn.name}.`;
                  }
                  return `🟢 ${stName} tem folga: aguenta ${extra} faltas a mais sem virar gargalo — a linha continua limitada por ${newBn.name}.`;
                })()}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Detalhe por estação */}
      <div style={{ marginTop: 16 }}>
        <SectionCard title="Detalhe por estação" subtitle="Postos, presença, cadência vs takt e folga até virar gargalo. Ordenado pela sequência da linha.">
          <Table
            rows={tableRows}
            columns={[
              { key: 'estacao', label: 'Estação', render: (r) => <span>{r.icon} {r.name}</span> },
              { key: 'assigned', label: 'Postos', align: 'right' },
              { key: 'present', label: 'Presentes', align: 'right' },
              { key: 'absent', label: 'Faltas', align: 'right', render: (r) => (r.absent > 0 ? <span className="prod-red-text">{r.absent}</span> : '0') },
              {
                key: 'capac',
                label: 'Capac. (veíc/h)',
                align: 'right',
                render: (r) => formatNumber(r.capacity, 1),
                cellStyle: (r) => {
                  const ratio = r.capacity / maxCapacity;
                  const alpha = 0.08 + ratio * 0.5;
                  return { background: `rgba(37, 99, 235, ${alpha})` };
                },
              },
              { key: 'cadencia', label: 'Cadência', align: 'right', render: (r) => `${formatNumber(r.cycle, 0)}s` },
              {
                key: 'buffer',
                label: 'Folga até gargalo',
                align: 'right',
                render: (r) => {
                  if (r.status === 'gargalo') return <span className="prod-red-text">em gargalo</span>;
                  if (r.buffer <= 0) return <span className="prod-amber-text">crítica (0)</span>;
                  return `${r.buffer} falta${r.buffer > 1 ? 's' : ''}`;
                },
              },
              {
                key: 'status',
                label: 'Status',
                sortAccessor: (r) => (r.status === 'gargalo' ? 2 : r.status === 'atencao' ? 1 : 0),
                render: (r) => <span className={`prod-badge ${statusClass(r.status)}`}>{r.statusLabel}</span>,
              },
            ]}
          />
        </SectionCard>
      </div>

      {/* Faltas de hoje */}
      {prod.totalAbsent > 0 && (
        <div style={{ marginTop: 16 }}>
          <SectionCard title="Faltas de hoje na linha" subtitle="Operadores ausentes por estação — clique no nome para abrir a ficha.">
            <div className="prod-absent-grid">
              {prod.stations.filter((s) => s.absentList.length > 0).map((s) => (
                <div key={s.id} className="prod-absent-col">
                  <div className="prod-absent-col-head">{s.icon} {s.name} <span>({s.absentList.length})</span></div>
                  <ul className="prod-absent-list">
                    {s.absentList.slice(0, 8).map((p) => (
                      <li key={p.id}><Link to={`/funcionario/${p.id}`}>{p.name}</Link> <span className="text-tertiary">· {p.roleLevel}</span></li>
                    ))}
                    {s.absentList.length > 8 && <li className="text-tertiary">+{s.absentList.length - 8} outros</li>}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
