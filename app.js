(function () {
  function normalizeCandidate(address, label) {
    const value = String(address || '').trim();
    const looksSecret = /seed|private key|mnemonic|\s{2,}/i.test(value) || value.split(/\s+/).length > 2;
    if (looksSecret || value.length < 32 || value.length > 60 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) return null;
    return { address: value, label: String(label || '').trim() || 'Unlabelled wallet', state: 'Candidate' };
  }

  function nextStateForDecision(decision) {
    return ({ 'Start paper track': 'Paper tracking', 'Keep active': 'Active', Pause: 'Paused', Drop: 'Dropped', 'Research further': 'Needs review' })[decision] || 'Candidate';
  }

  function paperTrackSummary(events) {
    const total = events.length;
    const usable = events.filter((event) => event.usability === 'Yes').length;
    const notUsable = events.filter((event) => event.usability === 'No').length;
    const cannotAssess = events.filter((event) => event.usability === 'Cannot assess').length;
    return { total, usable, notUsable, cannotAssess, usableRate: total ? Math.round((usable / total) * 100) : 0 };
  }

  if (typeof module !== 'undefined') module.exports = { normalizeCandidate, nextStateForDecision, paperTrackSummary };
  if (typeof document === 'undefined') return;

  const state = { view: 'scan', selected: null, loading: true, error: '', scan: null, toast: '' };
  const root = document.getElementById('app');
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
  const short = (value) => value ? `${value.slice(0, 5)}…${value.slice(-4)}` : '—';
  const dollars = (value) => value === null || value === undefined ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  const pct = (value) => value === null || value === undefined ? '—' : `${(value * 100).toFixed(1)}%`;
  const time = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const badge = (text) => `<span class="badge badge-${String(text).toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(text)}</span>`;

  function shell(content) {
    const nav = [['scan', 'Live scan'], ['boundary', 'Data boundary']].map(([key, label]) => `<button class="nav-item ${state.view === key ? 'active' : ''}" data-nav="${key}">${key === 'scan' ? '◷' : '◌'} ${label}</button>`).join('');
    return `<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">V</span><span>Vault<span class="muted">ra</span></span></div><div class="workspace">RESEARCH WORKSPACE <strong>Solana / read-only</strong></div><nav aria-label="Primary">${nav}</nav><div class="sidebar-foot"><span class="status-dot"></span> GMGN live scanner<br><small>No wallet connection · no trading</small></div></aside><main><header class="topbar"><div><p class="eyebrow">SOLANA · AUTOMATED CANDIDATE DISCOVERY</p><p class="top-caption">Live provider data is evidence for review, never a trade instruction.</p></div><button class="profile-chip" data-nav="boundary">Read-only</button></header><section class="content">${content}</section></main></div>${state.toast ? `<div class="toast" role="status">${esc(state.toast)}</div>` : ''}`;
  }

  function scanner() {
    if (state.loading) return `<div class="page-head"><div><p class="eyebrow">LIVE GMGN SCAN</p><h1>Finding candidates</h1><p class="lede">Requesting recent Smart Money buy activity and bounded 7D wallet surface evidence.</p></div></div><section class="panel"><p class="eyebrow">SCANNER STATUS</p><h2>Loading read-only data…</h2><p class="lede">No illustrative wallet records are shown while the scanner loads.</p></section>`;
    if (state.error) return `<div class="page-head"><div><p class="eyebrow">LIVE GMGN SCAN</p><h1>Scanner unavailable</h1><p class="lede">${esc(state.error)}</p></div><button class="primary" data-action="refresh">Try again <span>↻</span></button></div><section class="notice"><strong>Fail-closed state.</strong><span>No fabricated results are substituted when the provider is unavailable.</span></section>`;
    const candidates = state.scan?.candidates || [];
    return `<div class="page-head"><div><p class="eyebrow">LIVE GMGN SCAN · SOLANA</p><h1>Candidate queue</h1><p class="lede">Recent Smart Money buys enriched with a bounded 7D surface filter. Updated ${time(state.scan?.generatedAt)}.</p></div><button class="primary" data-action="refresh">Refresh now <span>↻</span></button></div><div class="notice"><strong>Research only.</strong><span>${candidates.length} unique wallet candidates · auto-refreshes while this page is open · no trades or wallet actions.</span></div>${candidates.length ? `<div class="table-panel"><div class="table-head"><span>WALLET / LATEST OBSERVATION</span><span>SURFACE</span><span>REALIZED 7D</span><span>WIN RATE</span><span>TRADE SAMPLE</span></div>${candidates.map((candidate, index) => `<button class="table-row" data-action="open" data-index="${index}"><span><strong>${short(candidate.address)}</strong><small>BUY ${esc(candidate.token)} · ${dollars(candidate.observedAmountUsd)} · ${time(candidate.observedAt * 1000)}</small></span><span>${badge(candidate.surfaceState)}</span><span>${dollars(candidate.evidence.realizedProfit)}</span><span>${pct(candidate.evidence.winRate)}</span><span>${candidate.evidence.tradeCount ?? '—'} tx / ${candidate.evidence.tokenCount ?? '—'} tokens</span></button>`).join('')}</div>` : `<section class="panel"><p class="eyebrow">NO LIVE CANDIDATES</p><h2>No qualifying Smart Money buy records returned.</h2><p class="lede">This is inconclusive, not a positive or negative signal. Refresh later.</p></section>`}<section class="quiet-state"><span>◌</span><div><strong>How candidates are chosen.</strong><p>GMGN Smart Money buys are only discovery input. A “Surface pass” means the returned 7D metrics clear basic coverage thresholds; it does not verify funding, clusters, transfers, or future performance.</p></div></section>`;
  }

  function detail() {
    const candidate = state.scan?.candidates?.[state.selected];
    if (!candidate) return scanner();
    const evidence = candidate.evidence;
    const rows = [['Latest observed buy', `${candidate.token} · ${dollars(candidate.observedAmountUsd)} · ${time(candidate.observedAt * 1000)}`], ['Realized profit · 7D', dollars(evidence.realizedProfit)], ['Realized PnL ratio', pct(evidence.pnlRatio)], ['Win rate', pct(evidence.winRate)], ['Buy + sell count', evidence.tradeCount === null ? 'Not returned' : `${evidence.tradeCount} transactions`], ['Token diversity', evidence.tokenCount === null ? 'Not returned' : `${evidence.tokenCount} tokens`], ['GMGN tags', candidate.tags.length ? candidate.tags.join(', ') : 'Not returned']];
    return `<div class="detail-head"><button class="back" data-action="close">← Back to live scan</button><div class="page-head compact"><div><p class="eyebrow">LIVE CANDIDATE · SURFACE REVIEW</p><h1><span class="wallet-dot"></span>${short(candidate.address)}</h1><p class="lede">Public Solana wallet · source: GMGN Smart Money activity + 7D portfolio stats.</p></div>${badge(candidate.surfaceState)}</div></div><div class="decision-band"><div><p class="eyebrow">CURRENT BOUNDARY</p><h2>This is a candidate for deeper review, not a watchlist approval.</h2><p>Funding/cluster independence, transfer attribution, full profit distribution, and 3–7 day actionability tracking are not inferred from this surface scan.</p></div></div><div class="score-grid">${rows.map(([label, value]) => `<article class="dimension"><div class="dimension-title"><h2>${esc(label)}</h2></div><p class="dimension-summary">${esc(value)}</p></article>`).join('')}</div><section class="ledger"><p class="eyebrow">NEXT EVIDENCE LAYERS</p><h2>Manual / deeper automation required</h2><p>Activity sampling, transfer-in analysis, creator history, cross-token repetition, funding-cluster checks, and paper tracking remain explicit next steps. Vaultra does not substitute a black-box score for missing evidence.</p></section>`;
  }

  function boundary() {
    return `<div class="page-head"><div><p class="eyebrow">DATA BOUNDARY</p><h1>Read-only, provider-backed research</h1><p class="lede">Vaultra uses GMGN OpenAPI from a server-side environment variable. The browser never receives the API key.</p></div></div><section class="profile-layout"><article class="data-boundary"><p class="eyebrow">CURRENT LIVE INPUTS</p><h2>Discovery + surface evidence</h2><p>Recent Smart Money buy records, then bounded 7D wallet statistics for unique candidates. Results are cached briefly to limit provider requests.</p></article><article class="data-boundary"><p class="eyebrow">NOT CONNECTED</p><h2>No trading capability</h2><p>No seed phrase, wallet private key, wallet signing, portfolio holdings, swap, order, or auto-copy execution is used. Funding and cluster independence remain unverified until a separate permissible evidence source is added.</p></article></section>`;
  }

  function render() { root.innerHTML = shell(state.selected !== null ? detail() : state.view === 'boundary' ? boundary() : scanner()); }
  function toast(message) { state.toast = message; render(); setTimeout(() => { state.toast = ''; render(); }, 2600); }
  async function loadScan() {
    state.loading = true; state.error = ''; render();
    try {
      const response = await fetch('/api/scan', { headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'scanner request failed');
      state.scan = payload; state.selected = null;
    } catch (error) {
      state.error = error.message === 'scanner_not_configured' ? 'The server-side scanner is not configured.' : 'The live provider could not return a scan. Try again later.';
    } finally { state.loading = false; render(); }
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-nav], [data-action]');
    if (!target) return;
    if (target.dataset.nav) { state.view = target.dataset.nav; state.selected = null; render(); return; }
    if (target.dataset.action === 'refresh') loadScan();
    if (target.dataset.action === 'open') { state.selected = Number(target.dataset.index); render(); }
    if (target.dataset.action === 'close') { state.selected = null; render(); }
  });

  render();
  loadScan();
  setInterval(() => { if (!state.loading && state.view === 'scan' && state.selected === null) loadScan(); }, 90000);
})();
