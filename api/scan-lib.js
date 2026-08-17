function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function statsByWallet(stats) {
  const rows = Array.isArray(stats) ? stats : stats ? [stats] : [];
  return new Map(rows.filter((row) => row?.wallet_address).map((row) => [row.wallet_address, row]));
}

function evidenceFor(stats) {
  if (!stats) return { statsAvailable: false, realizedProfit: null, pnlRatio: null, winRate: null, tradeCount: null, tokenCount: null };
  const buys = numberOrNull(stats.buy) ?? 0;
  const sells = numberOrNull(stats.sell) ?? 0;
  return {
    statsAvailable: true,
    realizedProfit: numberOrNull(stats.realized_profit),
    pnlRatio: numberOrNull(stats.realized_profit_pnl),
    winRate: numberOrNull(stats.pnl_stat?.winrate),
    tradeCount: buys + sells,
    tokenCount: numberOrNull(stats.pnl_stat?.token_num),
  };
}

function surfaceState(evidence) {
  if (!evidence.statsAvailable) return 'Needs review';
  if (evidence.realizedProfit !== null && evidence.realizedProfit > 0 && evidence.pnlRatio !== null && evidence.pnlRatio > 0 && evidence.winRate !== null && evidence.winRate >= 0.4 && evidence.tradeCount !== null && evidence.tradeCount < 300 && evidence.tokenCount !== null && evidence.tokenCount >= 10) return 'Surface pass';
  return 'Needs review';
}

function buildScanResult({ smartMoney, stats }) {
  const seen = new Set();
  const lookup = statsByWallet(stats);
  const candidates = (Array.isArray(smartMoney) ? smartMoney : [])
    .filter((trade) => trade?.side === 'buy' && trade?.maker && !seen.has(trade.maker) && seen.add(trade.maker))
    .slice(0, 8)
    .map((trade) => {
      const evidence = evidenceFor(lookup.get(trade.maker));
      return {
        address: trade.maker,
        token: trade.base_token?.symbol || 'Unknown token',
        tokenAddress: trade.base_address || null,
        observedAmountUsd: numberOrNull(trade.amount_usd),
        observedAt: numberOrNull(trade.timestamp),
        tags: Array.isArray(trade.maker_info?.tags) ? trade.maker_info.tags : [],
        surfaceState: surfaceState(evidence),
        evidence,
      };
    });
  return { candidates };
}

function publicScanError() {
  return { error: 'scanner_not_configured' };
}

module.exports = { buildScanResult, publicScanError };
