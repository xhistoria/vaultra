const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHealthRequest, classifyHealthResponse } = require('./gmgn-smoke.js');

test('builds a GMGN read-only health request without putting the key in the URL', () => {
  const request = buildHealthRequest({ apiKey: 'test-secret', now: 1700000000000, clientId: 'test-client' });
  assert.match(request.url, /^https:\/\/openapi\.gmgn\.ai\/v1\/market\/rank\?/);
  assert.match(request.url, /chain=sol/);
  assert.match(request.url, /interval=1h/);
  assert.doesNotMatch(request.url, /test-secret/);
  assert.equal(request.headers['X-APIKEY'], 'test-secret');
});

test('returns only a sanitized success summary from a GMGN response', () => {
  const outcome = classifyHealthResponse(200, { code: 0, data: { rank: [{}, {}] } });
  assert.deepEqual(outcome, { ok: true, rankCount: 2 });
});

test('does not expose provider response data when GMGN rejects a request', () => {
  const outcome = classifyHealthResponse(401, { code: 401, message: 'bad key', data: { apiKey: 'never-return' } });
  assert.deepEqual(outcome, { ok: false, status: 502, reason: 'provider_rejected_request' });
});
