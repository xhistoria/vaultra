const test = require('node:test');
const assert = require('node:assert/strict');
const { filterCandidates, explorerUrl } = require('./app.js');

const candidates = [
  { address: '0xAAA', token: 'Alpha', surfaceState: 'Surface pass', observedAt: 100, evidence: { realizedProfit: 100, winRate: 0.6 } },
  { address: '0xBBB', token: 'Beta', surfaceState: 'Needs review', observedAt: 300, evidence: { realizedProfit: -20, winRate: 0.3 } },
  { address: '0xCCC', token: 'Alpha Runner', surfaceState: 'Needs review', observedAt: 200, evidence: { realizedProfit: 500, winRate: 0.5 } },
];

test('filters candidates by search text and evidence state', () => {
  assert.deepEqual(filterCandidates(candidates, { query: 'alpha', state: 'all', sort: 'newest' }).map((row) => row.address), ['0xCCC', '0xAAA']);
  assert.deepEqual(filterCandidates(candidates, { query: '', state: 'surface-pass', sort: 'newest' }).map((row) => row.address), ['0xAAA']);
});

test('sorts candidates by newest observation or realized profit', () => {
  assert.deepEqual(filterCandidates(candidates, { query: '', state: 'all', sort: 'newest' }).map((row) => row.address), ['0xBBB', '0xCCC', '0xAAA']);
  assert.deepEqual(filterCandidates(candidates, { query: '', state: 'all', sort: 'profit' }).map((row) => row.address), ['0xCCC', '0xAAA', '0xBBB']);
});

test('creates chain-specific public explorer links and rejects unsupported chains', () => {
  assert.equal(explorerUrl('sol', 'abc'), 'https://solscan.io/account/abc');
  assert.equal(explorerUrl('robinhood', '0xabc'), 'https://arbiscan.io/address/0xabc');
  assert.equal(explorerUrl('bitcoin', 'abc'), null);
});
