import { useState } from 'react';
import SectionCard from '../components/ui/SectionCard.jsx';
import { getUsage, estimateCost, resetUsage, RATES } from '../data/geminiUsage.js';

const fmtInt = (n) => new Intl.NumberFormat('pt-BR').format(Math.round(n || 0));
const fmtUsd = (n) => `US$ ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
const fmtBrl = (n) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');

export default function GeminiUsage() {
  const [usage, setUsage] = useState(() => getUsage());
  const cost = estimateCost(usage);
  const avgTokens = usage.calls ? usage.totalTokens / usage.calls : 0;
  const avgCost = usage.calls ? cost.usd / usage.calls : 0;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Consumo do Gemini</h1>
          <p className="page-subtitle">
            Chamadas à IA (Íris) e custo estimado · contabilizado neste navegador · página interna
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => { resetUsage(); setUsage(getUsage()); }}
        >
          Zerar contador
        </button>
      </div>

      {usage.calls === 0 ? (
        <SectionCard title="Sem consumo registrado ainda">
          <p className="text-secondary">
            Assim que a Íris (chat/insights) responder via Gemini, as chamadas e os tokens aparecem aqui.
            A contagem é por navegador (não há banco de dados) e começa a partir de agora.
          </p>
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-4" style={{ marginBottom: 16 }}>
            <SectionCard title="Chamadas" info="Quantidade de respostas geradas pelo Gemini.">
              <div className="stat-big">{fmtInt(usage.calls)}</div>
            </SectionCard>
            <SectionCard title="Tokens totais" info="Soma de tokens de entrada (prompt) + saída (resposta).">
              <div className="stat-big">{fmtInt(usage.totalTokens)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>{fmtInt(avgTokens)} por chamada</p>
            </SectionCard>
            <SectionCard title="Custo estimado (US$)" info="Baseado no preço do gemini-2.5-flash. Estimativa.">
              <div className="stat-big" style={{ color: 'var(--color-primary)' }}>{fmtUsd(cost.usd)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>{fmtUsd(avgCost)} por chamada</p>
            </SectionCard>
            <SectionCard title="Custo estimado (R$)" info={`Convertido a US$ 1 = R$ ${RATES.usdToBrl.toFixed(2)} (ajustável).`}>
              <div className="stat-big" style={{ color: 'var(--color-primary)' }}>{fmtBrl(cost.brl)}</div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
            <SectionCard title="Tokens de entrada (prompt)" subtitle={`Custo: ${fmtUsd(cost.inUsd)}`}>
              <div className="stat-big" style={{ fontSize: 24 }}>{fmtInt(usage.promptTokens)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>US$ {RATES.inputPerMTokens.toFixed(2)} por 1M tokens</p>
            </SectionCard>
            <SectionCard title="Tokens de saída (resposta)" subtitle={`Custo: ${fmtUsd(cost.outUsd)}`}>
              <div className="stat-big" style={{ fontSize: 24 }}>{fmtInt(usage.outputTokens)}</div>
              <p className="text-secondary" style={{ fontSize: 12 }}>US$ {RATES.outputPerMTokens.toFixed(2)} por 1M tokens</p>
            </SectionCard>
          </div>

          <SectionCard title="Período">
            <div className="fact-grid">
              <div className="fact-item"><span className="fact-label">Primeira chamada</span><span className="fact-value">{fmtDate(usage.firstAt)}</span></div>
              <div className="fact-item"><span className="fact-label">Última chamada</span><span className="fact-value">{fmtDate(usage.lastAt)}</span></div>
            </div>
          </SectionCard>
        </>
      )}

      <p className="text-tertiary" style={{ fontSize: 11.5, marginTop: 16, lineHeight: 1.6 }}>
        Observação: a contagem é feita no seu navegador a partir do <code>usageMetadata</code> retornado pela API —
        reflete o uso desta máquina, não um total global de todos os visitantes. Preços do gemini-2.5-flash são
        estimativas; para o consumo oficial e faturado, consulte o Google AI Studio / Google Cloud Billing.
        Para um total global (todos os usuários), seria preciso registrar o uso num banco (ex.: Supabase).
      </p>
    </div>
  );
}
