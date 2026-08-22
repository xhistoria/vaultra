const test = require('node:test');
const assert = require('node:assert/strict');
const { gmgnPortfolioUrl } = require('./app.js');

test('builds a safe GMGN portfolio URL for Solana and Robinhood wallets', () => {
  const sol = gmgnPortfolioUrl('sol', '7Yk9aVNsJLHVjZm4X3D8w2YxN4TQPR8AeXfSQE6wDemo');
  const robinhood = gmgnPortfolioUrl('robinhood', '0xef90471fa80b1eb4226e2ea188fe4c013a920090');
  assert.equal(sol, 'https://gmgn.ai/sol/address/7Yk9aVNsJLHVjZm4X3D8w2YxN4TQPR8AeXfSQE6wDemo');
  assert.equal(robinhood, 'https://gmgn.ai/robinhood/address/0xef90471fa80b1eb4226e2ea188fe4c013a920090');
});

test('does not build external portfolio links for unsupported chains or empty addresses', () => {
  assert.equal(gmgnPortfolioUrl('bitcoin', 'abc'), null);
  assert.equal(gmgnPortfolioUrl('sol', ''), null);
});
