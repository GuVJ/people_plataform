import { useData } from '../context/DataContext.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

export default function Aso() {
  const { tx } = useLang();
  const { hr } = useData();
  const a = hr.aso;
  const k = a.kpis;
  const exportRows = a.byType.map((t) => ({ Tipo: t.label, Exames: t.count }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>{tx('ASO · Exames Ocupacionais')}</h1>
          <p className="page-subtitle">{tx('Atestados de Saúde Ocupacional por tipo, aptidão e vencimentos')}</p>
        </div>
        <ExportButton filename="aso_exames" sheetName="ASO" rows={exportRows} />
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
        <SectionCard title={tx('ASOs no mês')}>
          <div className="stat-big">{formatNumber(k.asosMes)}</div>
        </SectionCard>
        <SectionCard title={tx('Exames em dia')}>
          <div className="stat-big">{formatPercent(k.emDia)}</div>
        </SectionCard>
        <SectionCard title={tx('Vencidos')}>
          <div className="stat-big" style={{ color: 'var(--color-danger)' }}>{formatNumber(k.vencidos)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{formatNumber(k.vencendo30d)} {tx('vencendo em 30 dias')}</p>
        </SectionCard>
        <SectionCard title={tx('Inaptos')}>
          <div className="stat-big">{formatNumber(k.inaptos)}</div>
          <p className="text-secondary" style={{ fontSize: 12 }}>{tx('No período')}</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2">
        <SectionCard title={tx('Por tipo de exame')}>
          <DonutChart data={a.byType} centerValue={formatNumber(k.asosMes)} centerLabel={tx('ASOs/mês')} formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
        <SectionCard title={tx('Resultado de aptidão')}>
          <DonutChart data={a.aptidao} centerValue={formatPercent(k.emDia)} centerLabel={tx('em dia')} formatValue={(v) => formatNumber(v, 1)} />
        </SectionCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard title={tx('Exames vencendo por mês')} subtitle={tx('Próximos 12 meses')}>
          <LineChart history={a.vencimentos} color="var(--chart-5)" formatValue={(v) => formatNumber(v)} />
        </SectionCard>
      </div>
    </div>
  );
}
