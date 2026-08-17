const crypto = require('node:crypto');

function buildHealthRequest({ apiKey, now = Date.now(), clientId = crypto.randomUUID() }) {
  if (!apiKey) throw new Error('GMGN_API_KEY is not configured');
  const url = new URL('https://openapi.gmgn.ai/v1/market/rank');
  url.searchParams.set('chain', 'sol');
  url.searchParams.set('interval', '1h');
  url.searchParams.set('limit', '1');
  url.searchParams.set('timestamp', String(Math.floor(now / 1000)));
  url.searchParams.set('client_id', clientId);
  return {
    url: url.toString(),
    headers: {
      'X-APIKEY': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'Vaultra/0.1 GMGN-health-check',
    },
  };
}

function classifyHealthResponse(status, payload) {
  if (status === 200 && payload && payload.code === 0 && Array.isArray(payload.data?.rank)) {
    return { ok: true, rankCount: payload.data.rank.length };
  }
  return { ok: false, status: 502, reason: 'provider_rejected_request', providerStatus: status, providerCode: payload?.code ?? null };
}

async function runSmoke() {
  if (process.env.GMGN_SMOKE !== '1') {
    console.log('GMGN smoke skipped');
    return;
  }
  const request = buildHealthRequest({ apiKey: process.env.GMGN_API_KEY });
  const response = await fetch(request.url, { headers: request.headers });
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const outcome = classifyHealthResponse(response.status, payload);
  if (!outcome.ok) throw new Error(`GMGN smoke failed: ${outcome.reason} (HTTP ${outcome.providerStatus}, code ${outcome.providerCode})`);
  console.log(`GMGN_SMOKE_OK rank_count=${outcome.rankCount}`);
}

module.exports = { buildHealthRequest, classifyHealthResponse };

if (require.main === module) {
  runSmoke().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
