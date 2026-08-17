const crypto = require('node:crypto');
const { buildScanResult, publicScanError } = require('./scan-lib.js');

function providerUrl(path, parameters, now, randomUUID) {
  const url = new URL(`https://openapi.gmgn.ai${path}`);
  for (const [key, value] of Object.entries(parameters)) {
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
    else if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  url.searchParams.set('timestamp', String(Math.floor(now() / 1000)));
  url.searchParams.set('client_id', randomUUID());
  return url.toString();
}

function unwrap(payload) {
  if (!payload || payload.code !== 0) throw new Error('provider_rejected_request');
  return payload.data;
}

function createHandler({ env = process.env, fetchImpl = fetch, now = Date.now, randomUUID = crypto.randomUUID } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    if (req.query && Object.keys(req.query).length) return res.status(400).json({ error: 'invalid_request' });
    if (!env.GMGN_API_KEY) return res.status(503).json(publicScanError());

    const headers = { 'X-APIKEY': env.GMGN_API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'Vaultra/0.1 read-only-scanner' };
    try {
      const smartMoneyResponse = await fetchImpl(providerUrl('/v1/user/smartmoney', { chain: 'sol', limit: 20 }, now, randomUUID), { headers });
      const smartMoneyData = unwrap(await smartMoneyResponse.json());
      const trades = Array.isArray(smartMoneyData?.list) ? smartMoneyData.list : [];
      const addresses = [...new Set(trades.filter((trade) => trade?.side === 'buy' && trade?.maker).map((trade) => trade.maker))].slice(0, 8);
      const stats = addresses.length
        ? unwrap(await (await fetchImpl(providerUrl('/v1/user/wallet_stats', { chain: 'sol', wallet_address: addresses, period: '7d' }, now, randomUUID), { headers })).json())
        : [];
      const result = buildScanResult({ smartMoney: trades, stats });
      return res.status(200).json({ source: 'GMGN OpenAPI', chain: 'sol', generatedAt: new Date(now()).toISOString(), candidates: result.candidates });
    } catch {
      return res.status(502).json({ error: 'scanner_upstream_unavailable' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
