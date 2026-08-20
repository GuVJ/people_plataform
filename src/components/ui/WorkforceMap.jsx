import './WorkforceMap.css';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { formatNumber } from '../../utils/format.js';

// Coordenadas (lat, lng) reais das unidades da montadora fictícia (todas em SP/PR).
const GEO = {
  'São Bernardo do Campo - SP': { lat: -23.69, lng: -46.56, short: 'S. Bernardo do Campo', state: 'SP' },
  'Taubaté - SP': { lat: -23.03, lng: -45.56, short: 'Taubaté', state: 'SP' },
  'São José dos Pinhais - PR': { lat: -25.53, lng: -49.21, short: 'S. J. dos Pinhais', state: 'PR' },
  'São Carlos - SP (Motores)': { lat: -22.02, lng: -47.89, short: 'São Carlos', state: 'SP' },
  'Vinhedo - SP (CD)': { lat: -23.00, lng: -46.98, short: 'Vinhedo', state: 'SP' },
  'Sede Corporativa - SP': { lat: -23.55, lng: -46.63, short: 'Sede Corporativa', state: 'SP' },
};

// Litoral (N→S) do Sudeste/Sul, para dar cara de mapa (oceano a leste/sudeste).
const COAST = [
  [-23.43, -45.07], [-23.76, -45.41], [-23.96, -46.33], [-24.71, -47.55], [-25.52, -48.51], [-26.30, -48.60],
];

const W = 520;
const H = 460;
const M = { left: 24, right: 20, top: 18, bottom: 24 };
const deg2rad = (d) => (d * Math.PI) / 180;

export default function WorkforceMap({ data }) {
  const { tx } = useLang();
  const located = data.filter((d) => GEO[d.unit]).map((d) => ({ ...d, ...GEO[d.unit] }));
  const remote = data.find((d) => !GEO[d.unit]); // "Remoto"
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Bounding box (unidades + litoral) para enquadrar a região.
  const geoPts = [...located, ...COAST.map(([lat, lng]) => ({ lat, lng }))];
  const lats = geoPts.map((p) => p.lat);
  const lngs = geoPts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const meanLat = (minLat + maxLat) / 2;
  const lngK = Math.cos(deg2rad(meanLat)); // corrige a largura da longitude na latitude média
  const adjLngSpan = (maxLng - minLng) * lngK || 1;
  const latSpan = (maxLat - minLat) || 1;
  const mapW = W - M.left - M.right;
  const mapH = H - M.top - M.bottom;
  const scale = Math.min(mapW / adjLngSpan, mapH / latSpan) * 0.9;
  const offX = M.left + (mapW - adjLngSpan * scale) / 2;
  const offY = M.top + (mapH - latSpan * scale) / 2;
  const project = (lat, lng) => ({
    x: offX + (lng - minLng) * lngK * scale,
    y: offY + (maxLat - lat) * scale,
  });

  // Polígono do oceano: litoral projetado + cantos leste/sul para fechar a região SE.
  const coastPts = COAST.map(([lat, lng]) => project(lat, lng));
  const oceanPath = [
    `M ${coastPts[0].x.toFixed(1)} ${(M.top - 4).toFixed(1)}`,
    ...coastPts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${(W).toFixed(1)} ${(H).toFixed(1)}`,
    `L ${(W).toFixed(1)} ${(M.top - 4).toFixed(1)} Z`,
  ].join(' ');
  const coastLine = coastPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const rFor = (c) => 9 + Math.sqrt(c / maxCount) * 25;
  const bubbles = [...located].sort((a, b) => b.count - a.count); // maior atrás
  const ranked = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="wfmap">
      <div className="wfmap-map">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="wfmap-svg" role="img" aria-label={tx('Mapa de headcount por local de trabalho')}>
          {/* terra */}
          <rect x="0" y="0" width={W} height={H} rx="14" fill="var(--color-surface-subtle)" />
          {/* oceano (sudeste) */}
          <path d={oceanPath} fill="color-mix(in srgb, var(--color-info) 16%, var(--color-surface))" />
          <path d={coastLine} fill="none" stroke="color-mix(in srgb, var(--color-info) 45%, transparent)" strokeWidth="1.5" />
          <text x={W - 12} y={H - 14} textAnchor="end" className="wfmap-ocean-label">{tx('Oceano Atlântico')}</text>

          {/* rótulos de estado (posições aproximadas) */}
          {(() => { const p = project(-22.6, -47.6); return <text x={p.x} y={p.y} className="wfmap-state">SP</text>; })()}
          {(() => { const p = project(-25.0, -49.6); return <text x={p.x} y={p.y} className="wfmap-state">PR</text>; })()}

          {/* bolhas por unidade */}
          {bubbles.map((b) => {
            const { x, y } = project(b.lat, b.lng);
            const r = rFor(b.count);
            return (
              <g key={b.unit}>
                <title>{`${b.short} — ${formatNumber(b.count)} ${tx('colaboradores')}`}</title>
                <circle cx={x} cy={y} r={r} fill="var(--color-primary)" fillOpacity="0.42" stroke="var(--color-primary)" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="2" fill="var(--color-primary)" />
                <text x={x} y={y - r - 5} textAnchor="middle" className="wfmap-bubble-count">{formatNumber(b.count)}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="wfmap-legend">
        <div className="wfmap-legend-title">{tx('Ranking por unidade')}</div>
        {ranked.map((d) => {
          const geo = GEO[d.unit];
          const pct = (d.count / maxCount) * 100;
          return (
            <div className="wfmap-legend-row" key={d.unit}>
              <span className={`wfmap-legend-dot${geo ? '' : ' wfmap-legend-dot-remote'}`} />
              <span className="wfmap-legend-name">{geo ? geo.short : tx('Remoto')}{geo ? <span className="wfmap-legend-uf"> · {geo.state}</span> : null}</span>
              <span className="wfmap-legend-bar"><span className="wfmap-legend-bar-fill" style={{ width: `${pct}%` }} /></span>
              <span className="wfmap-legend-count">{formatNumber(d.count)}</span>
            </div>
          );
        })}
        <p className="wfmap-legend-foot">{tx('Tamanho da bolha = nº de colaboradores na unidade.')}</p>
      </div>
    </div>
  );
}
