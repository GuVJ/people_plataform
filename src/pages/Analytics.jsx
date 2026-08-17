import { useEffect, useState } from 'react';
import SectionCard from '../components/ui/SectionCard.jsx';
import LineChart from '../components/ui/LineChart.jsx';
import Table from '../components/ui/Table.jsx';
import { formatNumber } from '../utils/format.js';

function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${String(r).padStart(2, '0')}s`;
}

function fmtDateLabel(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}`;
}

const CHANNEL_PT = {
  'Direct': 'Direto', 'Organic Search': 'Busca orgânica', 'Paid Search': 'Busca paga',
  'Organic Social': 'Social orgânico', 'Paid Social': 'Social pago', 'Referral': 'Referência',
  'Email': 'E-mail', 'Display': 'Display', 'Unassigned': 'Não atribuído', 'Affiliates': 'Afiliados',
};
const DEVICE_PT = { desktop: 'Desktop', mobile: 'Celular', tablet: 'Tablet', smarttv: 'Smart TV' };

export default function Analytics() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/analytics', { headers: { Accept: 'application/json' } });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Endpoint indisponível (rode em produção na Vercel — a função /api não roda no dev local).');
        }
        const data = await res.json();
        if (!alive) return;
        if (data.error) setState({ status: 'error', data: null, error: data.error });
        else if (!data.configured) setState({ status: 'unconfigured', data, error: data.reason });
        else setState({ status: 'ready', data, error: null });
      } catch (err) {
        if (alive) setState({ status: 'error', data: null, error: err.message });
      }
    })();
    return () => { alive = false; };
  }, []);

  const { status, data, error } = state;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Analytics do site</h1>
          <p className="page-subtitle">
            Métricas de acesso da plataforma (Google Analytics 4) · últimos 28 dias · página interna
          </p>
        </div>
      </div>

      {status === 'loading' && (
        <SectionCard>
          <p className="text-secondary">Carregando métricas do Google Analytics…</p>
        </SectionCard>
      )}

      {status === 'unconfigured' && (
        <SectionCard title="Integração ainda não configurada">
          <p className="text-secondary" style={{ marginBottom: 12 }}>{error}</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            Para ligar os dados reais, defina 3 variáveis de ambiente na Vercel (Production):
          </p>
          <ul style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8, paddingLeft: 18 }}>
            <li><code>GA_PROPERTY_ID</code> — o ID numérico da propriedade GA4 (Admin → Detalhes da propriedade).</li>
            <li><code>GA_CLIENT_EMAIL</code> — e-mail do service account (…@…iam.gserviceaccount.com).</li>
            <li><code>GA_PRIVATE_KEY</code> — a chave privada do service account (do JSON baixado).</li>
          </ul>
          <p className="text-tertiary" style={{ fontSize: 12, marginTop: 12 }}>
            O service account precisa ter acesso de <strong>Leitor</strong> à propriedade no GA4. Depois de setar, um novo deploy ativa a página.
          </p>
        </SectionCard>
      )}

      {status === 'error' && (
        <SectionCard title="Não foi possível carregar">
          <p className="text-secondary">{error}</p>
        </SectionCard>
      )}

      {status === 'ready' && data && (
        <>
          <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
            <SectionCard title="Ativos agora" info="Usuários ativos no site nos últimos 30 minutos (tempo real).">
              <div className="stat-big" style={{ color: 'var(--color-success)' }}>{formatNumber(data.realtimeActiveUsers ?? 0)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>tempo real (30 min)</p>
            </SectionCard>
            <SectionCard title="Usuários (28d)" info="Usuários únicos que acessaram o site nos últimos 28 dias.">
              <div className="stat-big">{formatNumber(data.totals?.activeUsers ?? 0)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>{formatNumber(data.totals?.newUsers ?? 0)} novos</p>
            </SectionCard>
            <SectionCard title="Sessões (28d)" info="Visitas ao site (uma sessão pode ter várias páginas).">
              <div className="stat-big">{formatNumber(data.totals?.sessions ?? 0)}</div>
            </SectionCard>
            <SectionCard title="Visualizações (28d)" info="Total de páginas visualizadas, incluindo trocas de rota do app.">
              <div className="stat-big">{formatNumber(data.totals?.pageViews ?? 0)}</div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-3" style={{ marginBottom: 16 }}>
            <SectionCard title="Duração média da sessão">
              <div className="stat-big" style={{ fontSize: 24 }}>{fmtDuration(data.totals?.avgSessionDuration)}</div>
            </SectionCard>
            <SectionCard title="Taxa de rejeição" info="% de sessões sem engajamento (saíram sem interagir).">
              <div className="stat-big" style={{ fontSize: 24 }}>{formatNumber((data.totals?.bounceRate ?? 0) * 100, 1)}%</div>
            </SectionCard>
            <SectionCard title="Novos usuários (28d)">
              <div className="stat-big" style={{ fontSize: 24 }}>{formatNumber(data.totals?.newUsers ?? 0)}</div>
            </SectionCard>
          </div>

          <SectionCard title="Usuários por dia" subtitle="Últimos 28 dias" className="analytics-chart-card">
            <LineChart
              history={data.byDate.map((d) => ({ label: fmtDateLabel(d.date), y: d.users }))}
              formatValue={(v) => formatNumber(v, 0)}
            />
          </SectionCard>

          <div className="grid grid-cols-2" style={{ marginTop: 16 }}>
            <SectionCard title="Páginas mais acessadas" subtitle="Visualizações · 28 dias">
              <Table
                columns={[
                  { key: 'path', label: 'Página' },
                  { key: 'views', label: 'Views', align: 'right', render: (r) => formatNumber(r.views) },
                ]}
                rows={data.topPages}
              />
            </SectionCard>
            <SectionCard title="Origem do tráfego" subtitle="Sessões por canal · 28 dias">
              <Table
                columns={[
                  { key: 'source', label: 'Canal', render: (r) => CHANNEL_PT[r.source] ?? r.source },
                  { key: 'sessions', label: 'Sessões', align: 'right', render: (r) => formatNumber(r.sessions) },
                ]}
                rows={data.sources}
              />
            </SectionCard>
          </div>

          <div className="grid grid-cols-2" style={{ marginTop: 16 }}>
            <SectionCard title="Dispositivos" subtitle="Usuários · 28 dias">
              <Table
                columns={[
                  { key: 'device', label: 'Dispositivo', render: (r) => DEVICE_PT[r.device] ?? r.device },
                  { key: 'users', label: 'Usuários', align: 'right', render: (r) => formatNumber(r.users) },
                ]}
                rows={data.devices}
              />
            </SectionCard>
            <SectionCard title="Países" subtitle="Usuários · 28 dias">
              <Table
                columns={[
                  { key: 'country', label: 'País' },
                  { key: 'users', label: 'Usuários', align: 'right', render: (r) => formatNumber(r.users) },
                ]}
                rows={data.countries}
              />
            </SectionCard>
          </div>

          <p className="text-tertiary" style={{ fontSize: 11.5, marginTop: 16 }}>
            Fonte: Google Analytics 4. Dados de acesso reais do site (diferente dos dados de RH da plataforma, que são fictícios).
          </p>
        </>
      )}
    </div>
  );
}
