# GMGN Skills integration decision — Vaultra

**Date:** 2026-08-17  
**Status:** Approved provider for the first live-data scanner, pending a personal GMGN API key.

## Verified facts

- Upstream: `GMGNAI/gmgn-skills` at commit `b2df38d83687ed47493fd487df26875a32a8c2bd` (version `1.5.7`).
- `gmgn-cli` `1.5.7` is installed locally and read-only Solana `market trending` returned live data using GMGN's documented demo key.
- GMGN's web page was Cloudflare-blocked from this host; integration details were read from the official GitHub repository instead.
- The demo key is only for connection tests. GMGN's documentation requires a personal API key for actual use.

## Vaultra v1 data boundary

Use **read-only** GMGN commands only. Do not install a trading wallet or call `swap`, `order`, or `cooking`.

### Candidate discovery

1. `gmgn-cli track smartmoney --chain sol --side buy --limit 100 --raw`
2. `gmgn-cli market trending --chain sol --interval 1h ... --raw`
3. `gmgn-cli market trenches --chain sol --filter-preset safe --min-smart-degen-count 1 ... --raw`

These produce candidate wallet/token contexts. They are discovery inputs, never trade instructions.

### Wallet evidence enrichment

For a selected wallet:

1. `portfolio stats --period 7d` and `--period 30d`
2. `portfolio activity` (bounded/paginated sample)
3. `portfolio created-tokens` when it appears to be a creator wallet
4. `token security` only for a bounded sample of a creator's most recent launches

GMGN's official wallet-score skill provides a useful baseline: separate track record from copy-tradeability, penalize fast flips, early entries, and developer self-dealing. Vaultra will relabel its outcome as **human actionability / research fit**, not a trade recommendation or auto-copy decision.

### Safety and privacy

- Store provider credentials only in server-side secret configuration; never in browser JavaScript, Git, Vercel static files, logs, screenshots, or chat.
- `GMGN_API_KEY` is sufficient for the selected public-data scanning paths above.
- Do not use `track follow-wallet` (it exposes a user-specific follow list and needs request signing) in the first MVP.
- No `GMGN_PRIVATE_KEY` is required for the read-only first scanner.
- Use provider timestamps, endpoint names, and data-coverage state in every evidence record.
- Obey GMGN's documented leaky-bucket rate limits; no blind retry on `429`.

## Framework-to-provider mapping

The supplied **GMGN Wallet Screening Framework v1.1** is the operational rubric for Vaultra. Its original PDF is already stored in this workspace; the document re-sent on 2026-08-17 is byte-identical.

| Framework layer | GMGN read-only input | Vaultra output / boundary |
| --- | --- | --- |
| Discovery | `track smartmoney`, `market trending`, `market trenches` | Candidate queue; never a final watchlist. |
| Surface/performance | `portfolio stats` 7D + 30D | Realized P&L, win rate, PnL ratio, sample coverage. |
| Behavior | `portfolio activity` bounded sample | Trade frequency, hold-duration distribution, entry/exit observations, transfer-in ratio when records permit. |
| Creator/risk | `portfolio created-tokens`, `token security` | Creator/self-dealing and security flags; provider fields must be shown with coverage/uncertainty. |
| Cross-token validation | Repeated smart-money occurrences plus wallet stats/activity | Candidate corroboration only; not a claim of funding independence. |
| Funding/cluster | External explorer/manual review in v1 | Explicit `Needs manual verification`; GMGN data alone must not create an independence claim. |
| Paper tracking | Vaultra-owned observation records | 3–7 day actionability, latency, and edge-decay study—no paper P&L sell signal. |

The framework's final rule is preserved: a high-PnL wallet is not enough. Vaultra must show realized performance, distribution, consistency, risk cleanliness, style match, cross-token evidence, and actionability separately.

## Supported GMGN chains

Vaultra supports the GMGN chain identifiers `sol`, `bsc`, `base`, `eth`, `robinhood`, `arc`, and `stable` at the scanner boundary. The public UI currently exposes **Solana** and **Robinhood** as selectable networks. Robinhood was verified through the read-only GMGN Smart Money endpoint and returned live EVM wallet/token activity.

Robinhood candidates use the same discovery/surface pipeline, but are not treated as equivalent to Solana: address format, token context, liquidity, timing, and downstream evidence coverage remain chain-specific. A cross-chain comparison is not made by the scanner.


The current public Vercel site is static. Real scanning must be added as a server-side worker/API with a private `GMGN_API_KEY`, then the UI reads Vaultra-owned normalized evidence records. Never proxy a GMGN API key to the browser.

## Blocker

A personal GMGN API key has not been configured. The public demo key verified connectivity but must not be used in production.
