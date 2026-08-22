function compareSnapshot(previous, current) {
  if (!previous) return { status: 'new', scoreDelta: null };
  const previousScore = Number(previous.score?.total);
  const currentScore = Number(current.score?.total);
  const scoreDelta = Number.isFinite(previousScore) && Number.isFinite(currentScore) ? currentScore - previousScore : null;
  if (scoreDelta === null || Math.abs(scoreDelta) < 5) return { status: 'unchanged', scoreDelta };
  return { status: scoreDelta > 0 ? 'improved' : 'deteriorated', scoreDelta };
}

module.exports = { compareSnapshot };
