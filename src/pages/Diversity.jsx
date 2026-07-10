import { useData } from '../context/DataContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import BarChart from '../components/ui/BarChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Diversity() {
  const { metrics } = useData();
  const { diversity } = metrics;

  const genderComparison = diversity.gender.map((g) => {
    const lead = diversity.leadershipGender.find((l) => l.label === g.label);
    return { label: g.label, geral: g.pct, lideranca: lead?.pct ?? 0 };
  });

  const exportRows = diversity.race.map((r) => ({ Raça: r.label, Quantidade: r.count, 'Percentual (%)': r.pct.toFixed(1) }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Diversidade</h1>
          <p className="page-subtitle">Gênero, raça, gerações, PCD e representatividade na liderança</p>
        </div>
        <ExportButton filename="diversidade_raca" sheetName="Diversidade" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title="Mulheres no quadro">
          <div className="stat-big">{formatPercent(diversity.gender.find((g) => g.label === 'Feminino')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title="Mulheres na liderança">
          <div className="stat-big">{formatPercent(diversity.leadershipGender.find((g) => g.label === 'Feminino')?.pct ?? 0)}</div>
        </SectionCard>
        <SectionCard title="Pretos e pardos">
          <div className="stat-big">{formatPercent((diversity.race.find((r) => r.label === 'Preta')?.pct ?? 0) + (diversity.race.find((r) => r.label === 'Parda')?.pct ?? 0))}</div>
        </SectionCard>
        <SectionCard title="PCD no quadro">
          <div className="stat-big">{formatPercent(diversity.pcdPct)}</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 16 }}>
        <SectionCard title="Gênero">
          <DonutChart data={diversity.gender} centerValue={formatNumber(metrics.activeNow.length)} centerLabel="colaboradores" />
        </SectionCard>
        <SectionCard title="Raça / Etnia">
          <DonutChart data={diversity.race} />
        </SectionCard>
        <SectionCard title="Gerações">
          <DonutChart data={diversity.generation} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title="Gênero — quadro geral vs. liderança" subtitle="Comparação de representatividade">
          <BarChart
            data={genderComparison.map((g) => ({ label: `${g.label} · Geral`, value: g.geral }))}
            valueKey="value" labelKey="label" formatValue={(v) => formatPercent(v)}
          />
          <BarChart
            data={genderComparison.map((g) => ({ label: `${g.label} · Liderança`, value: g.lideranca }))}
            valueKey="value" labelKey="label" color="var(--color-navy)" formatValue={(v) => formatPercent(v)}
          />
        </SectionCard>
        <SectionCard title="Raça — representatividade na liderança">
          <BarChart data={diversity.leadershipRace} valueKey="pct" labelKey="label" color="var(--chart-6)" formatValue={(v) => formatPercent(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
