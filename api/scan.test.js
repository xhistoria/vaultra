const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('./scan.js');

function response(status, payload) {
  return { status, async json() { return payload; } };
}

function makeRes() {
  return { statusCode: 200, headers: {}, body: null, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; }, end() {} };
}

test('scan handler fails closed when the GMGN key is unavailable', async () => {
  const handler = createHandler({ env: {}, fetchImpl: async () => { throw new Error('should not fetch'); } });
  const res = makeRes();
  await handler({ method: 'GET', query: {} }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: 'scanner_not_configured' });
});

test('scan handler returns normalized live candidate evidence without provider credentials', async () => {
  const calls = [];
  const handler = createHandler({
    env: { GMGN_API_KEY: 'test-secret' },
    randomUUID: () => 'fixed-client',
    now: () => 1700000000000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/v1/user/smartmoney')) return response(200, { code: 0, data: { list: [{ maker: 'Wallet111111111111111111111111111111111', side: 'buy', amount_usd: 125, timestamp: 1700000100, base_address: 'TokenA', base_token: { symbol: 'ALPHA' }, maker_info: { tags: ['smart_degen'] } }] } });
      return response(200, { code: 0, data: [{ wallet_address: 'Wallet111111111111111111111111111111111', realized_profit: '1000', realized_profit_pnl: '1.2', buy: 12, sell: 10, pnl_stat: { winrate: 0.55, token_num: 18 } }] });
    },
  });
  const res = makeRes();
  await handler({ method: 'GET', query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.candidates[0].surfaceState, 'Surface pass');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers['X-APIKEY'], 'test-secret');
  assert.doesNotMatch(calls[0].url, /test-secret/);
  assert.equal(res.headers['Cache-Control'], 's-maxage=60, stale-while-revalidate=120');
});
