const test = require('node:test');
const assert = require('node:assert/strict');
const { compareSnapshot } = require('./delta.js');

test('classifies a first observation as new', () => {
  assert.deepEqual(compareSnapshot(null, { score: { total: 50 } }), { status: 'new', scoreDelta: null });
});

test('classifies material score movement for review', () => {
  assert.deepEqual(compareSnapshot({ score: { total: 50 } }, { score: { total: 63 } }), { status: 'improved', scoreDelta: 13 });
  assert.deepEqual(compareSnapshot({ score: { total: 70 } }, { score: { total: 61 } }), { status: 'deteriorated', scoreDelta: -9 });
});

test('does not overstate immaterial movement', () => {
  assert.deepEqual(compareSnapshot({ score: { total: 50 } }, { score: { total: 54 } }), { status: 'unchanged', scoreDelta: 4 });
});
