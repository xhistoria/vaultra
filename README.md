# Vaultra — clickable MVP prototype

## What this is

A local, research-only clickable MVP for a solo manual Solana trader. It uses **illustrative static data only**. It has no live chain feed, wallet connection, signing, trade execution, price prediction, or investment-advice flow.

## Run locally

```bash
cd /home/ubuntu/projects/idea-lab/ideas/wallet-edge-os
python3 -m http.server 8787 --bind 127.0.0.1
```

Open: `http://127.0.0.1:8787/`

Opening `index.html` directly also works for the basic prototype.

## Included flows

- Today review queue
- Wallets research list
- Wallet scorecard with five evidence dimensions
- Candidate form with public-address-only guard
- 3–7 day observational paper track
- Weekly review comparison
- Tracking-profile and data-boundary screen

## Verification

```bash
npm test
node --check app.js
```

The tests cover public-address candidate normalization, auditable state transitions, and non-financial paper-track usability summaries.

## Production boundary

This is a UI/interaction prototype, not a live trading product. Any future live-data implementation requires a documented permissible provider/data path, provenance, rate/cost controls, and legal review of customer-facing redistribution rights.
