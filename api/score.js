function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function metrics(stats) {
  if (!stats) return null;
  const buys = number(stats.buy) ?? 0;
  const sells = number(stats.sell) ?? 0;
  return {
    realizedProfit: number(stats.realized_profit),
    pnlRatio: number(stats.realized_profit_pnl),
    winRate: number(stats.pnl_stat?.winrate),
    tradeCount: buys + sells,
    tokenCount: number(stats.pnl_stat?.token_num),
  };
}

function scoreCandidate({ stats7d, stats30d }) {
  const short = metrics(stats7d);
  const long = metrics(stats30d);
  const reasons = [];
  const unknowns = [];
  let performance = 0;
  let efficiency = 0;
  let consistency = 0;
  let diversity = 0;
  let coverage = 0;

  if (short?.realizedProfit > 0) performance += 15; else unknowns.push('7D realized profit unavailable or non-positive');
  if (long?.realizedProfit > 0) performance += 10; else if (!long) unknowns.push('30D statistics unavailable');
  if (short?.pnlRatio > 1) efficiency += 10;
  if (long?.pnlRatio > 1) efficiency += 10;
  if (short?.winRate >= 0.4) consistency += 12;
  if (long?.winRate >= 0.4) consistency += 13;
  if (short && long && short.realizedProfit > 0 && long.realizedProfit > 0) reasons.push('7D and 30D realized performance are both positive');
  if (short?.tokenCount >= 10) diversity += 8;
  if (long?.tokenCount >= 10) diversity += 7;
  if (short) coverage += 8;
  if (long) coverage += 7;
  if (short && short.tradeCount !== null && short.tradeCount < 300) reasons.push('7D activity is within the human-review sample baseline');
  else unknowns.push('7D activity count unavailable or high-frequency');

  const total = Math.round(performance + efficiency + consistency + diversity + coverage);
  const coverageLabel = coverage >= 15 ? 'strong' : coverage >= 8 ? 'partial' : 'limited';
  return { total, coverage: coverageLabel, dimensions: { performance, efficiency, consistency, diversity, coverage }, reasons, unknowns };
}

module.exports = { scoreCandidate, metrics };
