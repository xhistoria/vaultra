const test = require('node:test');
const assert = require('node:assert/strict');
const { buildScanResult, publicScanError } = require('./scan-lib.js');

const smartMoney = [
  { maker: 'Wallet111111111111111111111111111111111', side: 'buy', amount_usd: 125, timestamp: 1700000100, base_address: 'TokenA', base_token: { symbol: 'ALPHA' }, maker_info: { tags: ['smart_degen'] } },
  { maker: 'Wallet111111111111111111111111111111111', side: 'buy', amount_usd: 30, timestamp: 1700000000, base_address: 'TokenB', base_token: { symbol: 'BETA' }, maker_info: { tags: ['smart_degen'] } },
  { maker: 'Wallet222222222222222222222222222222222', side: 'sell', amount_usd: 999, timestamp: 1700000200, base_address: 'TokenC', base_token: { symbol: 'SKIP' } },
];

test('buildScanResult keeps distinct live smart-money buy wallets and marks incomplete evidence honestly', () => {
  const result = buildScanResult({ smartMoney, stats: [] });
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.candidates[0], {
    address: 'Wallet111111111111111111111111111111111',
    token: 'ALPHA',
    tokenAddress: 'TokenA',
    observedAmountUsd: 125,
    observedAt: 1700000100,
    tags: ['smart_degen'],
    surfaceState: 'Needs review',
    evidence: { statsAvailable: false, realizedProfit: null, pnlRatio: null, winRate: null, tradeCount: null, tokenCount: null },
  });
});

test('buildScanResult reports surface metrics without turning them into a recommendation', () => {
  const result = buildScanResult({ smartMoney, stats: [{ wallet_address: 'Wallet111111111111111111111111111111111', realized_profit: '1000', realized_profit_pnl: '1.2', buy: 12, sell: 10, pnl_stat: { winrate: 0.55, token_num: 18 } }] });
  assert.equal(result.candidates[0].surfaceState, 'Surface pass');
  assert.deepEqual(result.candidates[0].evidence, { statsAvailable: true, realizedProfit: 1000, pnlRatio: 1.2, winRate: 0.55, tradeCount: 22, tokenCount: 18 });
});

test('publicScanError never includes an upstream message or credential detail', () => {
  assert.deepEqual(publicScanError('GMGN_API_KEY missing'), { error: 'scanner_not_configured' });
});
