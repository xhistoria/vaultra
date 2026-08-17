const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCandidate, nextStateForDecision, paperTrackSummary } = require('./app.js');

test('normalizes a valid public Solana candidate without retaining secret-like input', () => {
  const address = '7Yk9aVNsJLHVjZm4X3D8w2YxN4TQPR8AeXfSQE6wDemo';
  assert.deepEqual(normalizeCandidate(address, 'Orbit'), {
    address,
    label: 'Orbit',
    state: 'Candidate',
  });
  assert.equal(normalizeCandidate('seed phrase words here', 'Unsafe'), null);
});

test('maps research decisions to auditable wallet states', () => {
  assert.equal(nextStateForDecision('Start paper track'), 'Paper tracking');
  assert.equal(nextStateForDecision('Keep active'), 'Active');
  assert.equal(nextStateForDecision('Pause'), 'Paused');
  assert.equal(nextStateForDecision('Drop'), 'Dropped');
  assert.equal(nextStateForDecision('Research further'), 'Needs review');
});

test('summarizes paper-track usability without calculating financial performance', () => {
  assert.deepEqual(
    paperTrackSummary([
      { usability: 'Yes' },
      { usability: 'No' },
      { usability: 'Cannot assess' },
      { usability: 'Yes' },
    ]),
    { total: 4, usable: 2, notUsable: 1, cannotAssess: 1, usableRate: 50 }
  );
});
