const crypto = require('node:crypto');
const { buildScanResult, publicScanError } = require('./scan-lib.js');
const { scoreCandidate } = require('./score.js');
const { createPersistence } = require('./persistence.js');

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

const SUPPORTED_CHAINS = new Set(['sol', 'bsc', 'base', 'eth', 'robinhood', 'arc', 'stable']);

function requestedChain(req) {
  const chain = String(req.query?.chain || 'sol').toLowerCase();
  return SUPPORTED_CHAINS.has(chain) ? chain : null;
}

function createHandler({ env = process.env, fetchImpl = fetch, now = Date.now, randomUUID = crypto.randomUUID, persistence = createPersistence({ env, fetchImpl }) } = {}) {
  return async function handler(req, res) {
    const cachePolicy = 's-maxage=60, stale-while-revalidate=120';
    res.setHeader('Cache-Control', cachePolicy);
    res.setHeader('Vercel-CDN-Cache-Control', cachePolicy);
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    const chain = requestedChain(req);
    if (!chain) return res.status(400).json({ error: 'unsupported_chain' });
    if (!env.GMGN_API_KEY) return res.status(503).json(publicScanError());

    const headers = { 'X-APIKEY': env.GMGN_API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'Vaultra/0.1 read-only-scanner' };
    try {
      const smartMoneyResponse = await fetchImpl(providerUrl('/v1/user/smartmoney', { chain, limit: 20 }, now, randomUUID), { headers });
      const smartMoneyData = unwrap(await smartMoneyResponse.json());
      const trades = Array.isArray(smartMoneyData?.list) ? smartMoneyData.list : [];
      const addresses = [...new Set(trades.filter((trade) => trade?.side === 'buy' && trade?.maker).map((trade) => trade.maker))].slice(0, 8);
      const fetchStats = async (period) => addresses.length
        ? unwrap(await (await fetchImpl(providerUrl('/v1/user/wallet_stats', { chain, wallet_address: addresses, period }, now, randomUUID), { headers })).json())
        : [];
      const stats7d = await fetchStats('7d');
      const stats30d = await fetchStats('30d');
      const result = buildScanResult({ smartMoney: trades, stats: stats7d });
      const statsByAddress = (rows) => new Map((Array.isArray(rows) ? rows : [rows]).filter((row) => row?.wallet_address).map((row) => [row.wallet_address, row]));
      const sevenDay = statsByAddress(stats7d);
      const thirtyDay = statsByAddress(stats30d);
      const candidates = result.candidates.map((candidate) => {
        const stats7 = sevenDay.get(candidate.address) || null;
        const stats30 = thirtyDay.get(candidate.address) || null;
        return { ...candidate, score: scoreCandidate({ stats7d: stats7, stats30d: stats30 }), evidence: { ...candidate.evidence, stats30dAvailable: Boolean(stats30), realizedProfit30d: stats30 ? Number(stats30.realized_profit) : null, winRate30d: stats30?.pnl_stat?.winrate ?? null } };
      });
      const persistenceResult = await persistence.persistScan({ chain, generatedAt: new Date(now()).toISOString(), candidates });
      return res.status(200).json({ source: 'GMGN OpenAPI', chain, generatedAt: new Date(now()).toISOString(), persistence: persistenceResult.status, candidates });
    } catch {
      return res.status(502).json({ error: 'scanner_upstream_unavailable' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
