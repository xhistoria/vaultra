const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreCandidate } = require('./score.js');

test('scores a candidate transparently from realized performance and consistency', () => {
  const result = scoreCandidate({
    stats7d: { realized_profit: '1000', realized_profit_pnl: '1.5', buy: 20, sell: 15, pnl_stat: { winrate: 0.6, token_num: 18 } },
    stats30d: { realized_profit: '4200', realized_profit_pnl: '1.4', buy: 80, sell: 70, pnl_stat: { winrate: 0.58, token_num: 32 } },
  });
  assert.equal(result.total, 100);
  assert.equal(result.coverage, 'strong');
  assert.ok(result.reasons.some((reason) => reason.includes('7D and 30D')));
});

test('does not award false confidence when 30D evidence is missing', () => {
  const result = scoreCandidate({ stats7d: { realized_profit: '1000', realized_profit_pnl: '1.5', buy: 20, sell: 15, pnl_stat: { winrate: 0.6, token_num: 18 } }, stats30d: null });
  assert.equal(result.coverage, 'partial');
  assert.ok(result.total < 100);
  assert.ok(result.unknowns.includes('30D statistics unavailable'));
});
