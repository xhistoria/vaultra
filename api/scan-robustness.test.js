const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('./scan.js');

function res() { return { statusCode: 200, body: null, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } }; }

test('30D enrichment failure does not take down the live 7D scanner', async () => {
  const handler = createHandler({
    env: { GMGN_API_KEY: 'secret' },
    randomUUID: () => 'id',
    now: () => 1700000000000,
    fetchImpl: async (url) => {
      if (url.includes('/smartmoney')) return { async json() { return { code: 0, data: { list: [{ maker: 'Wallet111111111111111111111111111111111', side: 'buy', amount_usd: 1, timestamp: 1700000100, base_token: { symbol: 'A' } }] } }; } };
      if (url.includes('period=30d')) return { async json() { return { code: 401, data: null }; } };
      return { async json() { return { code: 0, data: [] }; } };
    },
  });
  const output = res();
  await handler({ method: 'GET', query: { chain: 'sol' } }, output);
  assert.equal(output.statusCode, 200);
  assert.equal(output.body.candidates[0].evidence.stats30dAvailable, false);
});
