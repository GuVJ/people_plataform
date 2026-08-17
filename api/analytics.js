// Vercel serverless function — busca métricas do Google Analytics 4 (Data API)
// usando um service account. As credenciais ficam só no servidor (env vars).
// Sem dependências externas: o token OAuth2 é obtido assinando um JWT com o
// módulo `crypto` nativo do Node (mesmo estilo enxuto do api/chat.js).
import crypto from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

async function getAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKey, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Falha ao obter token (${resp.status}): ${(await resp.text()).slice(0, 200)}`);
  }
  const json = await resp.json();
  return json.access_token;
}

// Helpers para ler linhas do formato do GA4 Data API.
const dimVal = (row, i) => row.dimensionValues?.[i]?.value ?? '';
const metVal = (row, i) => Number(row.metricValues?.[i]?.value ?? 0);

export default async function handler(req, res) {
  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  let privateKey = process.env.GA_PRIVATE_KEY;

  if (!propertyId || !clientEmail || !privateKey) {
    res.status(200).json({
      configured: false,
      reason: 'Faltam variáveis de ambiente: GA_PROPERTY_ID, GA_CLIENT_EMAIL e/ou GA_PRIVATE_KEY.',
    });
    return;
  }
  // Chaves privadas no painel da Vercel vêm com \n literais — normaliza.
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const token = await getAccessToken(clientEmail, privateKey);
    const base = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}`;
    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Um único batch com os relatórios históricos (28 dias).
    const batchBody = {
      requests: [
        { // 0 — totais
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
            { name: 'newUsers' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' },
          ],
        },
        { // 1 — série por dia
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
        { // 2 — páginas mais vistas
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 8,
        },
        { // 3 — canais de origem
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 8,
        },
        { // 4 — dispositivos
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        },
        { // 5 — países
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 6,
        },
      ],
    };

    const [batchResp, rtResp] = await Promise.all([
      fetch(`${base}:batchRunReports`, { method: 'POST', headers: authHeaders, body: JSON.stringify(batchBody) }),
      fetch(`${base}:runRealtimeReport`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ metrics: [{ name: 'activeUsers' }] }),
      }),
    ]);

    if (!batchResp.ok) {
      res.status(502).json({ configured: true, error: `GA4 respondeu ${batchResp.status}: ${(await batchResp.text()).slice(0, 300)}` });
      return;
    }

    const batch = await batchResp.json();
    const reports = batch.reports ?? [];
    const totalsRow = reports[0]?.rows?.[0];
    const rt = rtResp.ok ? await rtResp.json() : null;

    const payload = {
      configured: true,
      rangeDays: 28,
      realtimeActiveUsers: rt ? metVal(rt.rows?.[0] ?? {}, 0) : null,
      totals: totalsRow ? {
        activeUsers: metVal(totalsRow, 0),
        sessions: metVal(totalsRow, 1),
        pageViews: metVal(totalsRow, 2),
        newUsers: metVal(totalsRow, 3),
        avgSessionDuration: metVal(totalsRow, 4),
        bounceRate: metVal(totalsRow, 5),
      } : null,
      byDate: (reports[1]?.rows ?? []).map((r) => ({
        date: dimVal(r, 0), // YYYYMMDD
        users: metVal(r, 0),
        sessions: metVal(r, 1),
      })),
      topPages: (reports[2]?.rows ?? []).map((r) => ({ path: dimVal(r, 0), views: metVal(r, 0) })),
      sources: (reports[3]?.rows ?? []).map((r) => ({ source: dimVal(r, 0), sessions: metVal(r, 0) })),
      devices: (reports[4]?.rows ?? []).map((r) => ({ device: dimVal(r, 0), users: metVal(r, 0) })),
      countries: (reports[5]?.rows ?? []).map((r) => ({ country: dimVal(r, 0), users: metVal(r, 0) })),
    };

    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ configured: true, error: `Falha ao consultar o GA4: ${err.message}` });
  }
}
