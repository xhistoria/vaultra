const test = require('node:test');
const assert = require('node:assert/strict');
const { createPersistence } = require('./persistence.js');

function makeFetch() {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 201, async json() { return [{ id: 'run-1' }]; } };
  };
  return { fetchImpl, calls };
}

test('persistence is disabled without Supabase credentials', async () => {
  const persistence = createPersistence({ env: {} });
  assert.deepEqual(await persistence.persistScan({ chain: 'sol', generatedAt: '2026-01-01T00:00:00.000Z', candidates: [] }), { status: 'not_configured' });
});

test('persistence writes a scan run and normalized candidate snapshots through Supabase REST', async () => {
  const { fetchImpl, calls } = makeFetch();
  const persistence = createPersistence({ env: { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret' }, fetchImpl });
  const result = await persistence.persistScan({ chain: 'robinhood', generatedAt: '2026-01-01T00:00:00.000Z', candidates: [{ address: '0xabc', token: 'FLR', tokenAddress: '0xtoken', surfaceState: 'Needs review', score: { total: 42 }, evidence: { statsAvailable: true } }] });
  assert.deepEqual(result, { status: 'persisted', runId: 'run-1', candidateCount: 1 });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /scan_runs$/);
  assert.match(calls[1].url, /wallet_snapshots$/);
  assert.equal(calls[0].options.headers.apikey, 'secret');
  assert.doesNotMatch(calls[0].url, /secret/);
  const snapshotBody = JSON.parse(calls[1].options.body);
  assert.equal(snapshotBody[0].wallet_address, '0xabc');
  assert.equal(snapshotBody[0].chain, 'robinhood');
});

test('persistence sanitizes Supabase failures', async () => {
  const persistence = createPersistence({ env: { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret' }, fetchImpl: async () => ({ ok: false, status: 500, async text() { return 'internal secret details'; } }) });
  assert.deepEqual(await persistence.persistScan({ chain: 'sol', generatedAt: '2026-01-01T00:00:00.000Z', candidates: [] }), { status: 'error', reason: 'database_unavailable' });
});
