(function () {
  function normalizeCandidate(address, label) {
    const value = String(address || '').trim();
    const looksSecret = /seed|private key|mnemonic|\s{2,}/i.test(value) || value.split(/\s+/).length > 2;
    if (looksSecret || value.length < 32 || value.length > 60 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) return null;
    return { address: value, label: String(label || '').trim() || 'Unlabelled wallet', state: 'Candidate' };
  }

  function nextStateForDecision(decision) {
    return ({
      'Start paper track': 'Paper tracking',
      'Keep active': 'Active',
      Pause: 'Paused',
      Drop: 'Dropped',
      'Research further': 'Needs review',
    })[decision] || 'Candidate';
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

  const wallet = {
    label: 'Orbit',
    address: '7Yk9…wDemo',
    state: 'Paper tracking',
    fit: 'Mixed fit',
    confidence: 'Moderate',
    assessed: '17 Aug 2026, 09:42 UTC',
    note: 'Illustrative research data only — not current wallet activity.',
    dimensions: [
      { name: 'Repeatability', status: 'Mixed evidence', confidence: 'Moderate', summary: 'Observed history spans 14 tokens, but 41% of realised outcome is concentrated in two records.', evidence: '14 classifiable token records · 30D coverage', counter: 'Three records have incomplete attribution' },
      { name: 'Execution style', status: 'Strong evidence', confidence: 'Moderate', summary: 'Observed holding band is mostly hours, with occasional faster activity.', evidence: 'Median observed hold: 11h 20m', counter: '4 of 22 events were under 30 minutes' },
      { name: 'Cleanliness', status: 'Needs review', confidence: 'Low', summary: 'Incoming transfers cannot be fully separated from market entries in the current data sample.', evidence: '4 ambiguous incoming token events', counter: 'Coverage is incomplete; do not infer intent' },
      { name: 'Independence', status: 'Insufficient data', confidence: 'Insufficient', summary: 'No conclusion is shown until a permissible funding-analysis source is available.', evidence: 'No licensed cluster dataset connected', counter: 'Manual review remains open' },
      { name: 'Actionability', status: 'Mixed evidence', confidence: 'Moderate', summary: 'The style broadly matches an hours horizon; two observed events were detected too late for the stated profile.', evidence: '2 of 4 observed events had usable timing', counter: 'One event lacks a detection timestamp' },
    ],
  };

  const trackEvents = [
    { time: '17 Aug · 07:14 UTC', type: 'Observed swap', context: 'Source context available', usability: 'Yes', reason: 'Visible inside stated horizon', detected: '07:18 UTC' },
    { time: '16 Aug · 18:41 UTC', type: 'Observed transfer', context: 'Attribution ambiguous', usability: 'Cannot assess', reason: 'Ambiguous transaction', detected: '18:48 UTC' },
    { time: '16 Aug · 09:06 UTC', type: 'Observed swap', context: 'Context available', usability: 'No', reason: 'Detected too late', detected: '09:43 UTC' },
    { time: '15 Aug · 15:28 UTC', type: 'Observed balance change', context: 'Detection time unavailable', usability: 'Cannot assess', reason: 'Cannot assess timing', detected: '—' },
  ];

  const state = { view: 'today', showAdd: false, detail: false, toast: '', candidate: null };
  const root = document.getElementById('app');

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
  const badge = (text) => `<span class="badge badge-${text.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(text)}</span>`;
  const icon = (name) => ({ today: '◷', wallets: '◎', tracks: '↗', review: '▤', profile: '◌' }[name] || '·');

  function shell(content) {
    const nav = [
      ['today', 'Today'], ['wallets', 'Wallets'], ['tracks', 'Paper tracks'], ['review', 'Weekly review'], ['profile', 'Profile & data'],
    ].map(([key, label]) => `<button class="nav-item ${state.view === key ? 'active' : ''}" data-nav="${key}"><span aria-hidden="true">${icon(key)}</span>${label}</button>`).join('');
    return `<div class="app-shell">
      <aside class="sidebar"><div class="brand"><span class="brand-mark">V</span><span>Vault<span class="muted">ra</span></span></div>
      <div class="workspace">RESEARCH WORKSPACE <strong>Solo / Solana</strong></div><nav aria-label="Primary">${nav}</nav>
      <div class="sidebar-foot"><span class="status-dot"></span> Research-only MVP<br><small>Illustrative local prototype</small></div></aside>
      <main><header class="topbar"><div><p class="eyebrow">SOLANA · MANUAL RESEARCH</p><p class="top-caption">Data shown is illustrative. No live chain feed connected.</p></div><button class="profile-chip" data-nav="profile" aria-label="Open profile and data settings">SM <span>Solo manual</span></button></header>
      <section class="content">${content}</section></main></div>${state.showAdd ? addPanel() : ''}${state.toast ? `<div class="toast" role="status">${esc(state.toast)}</div>` : ''}`;
  }

  function today() {
    return `<div class="page-head"><div><p class="eyebrow">17 AUG 2026</p><h1>Today</h1><p class="lede">A small queue of evidence changes that need your judgement.</p></div><button class="primary" data-action="open-add">Add a candidate <span>+</span></button></div>
    <div class="notice"><strong>Research and recordkeeping only.</strong><span>This workspace does not execute trades or provide investment advice.</span></div>
    <section class="split-grid"><div class="panel review-panel"><div class="panel-title"><div><p class="eyebrow">REVIEW QUEUE</p><h2>2 items need attention</h2></div>${badge('Moderate confidence')}</div>
      <article class="review-card"><div class="card-top"><div><span class="wallet-dot"></span><strong>Orbit</strong> <span class="address">7Yk9…wDemo</span></div>${badge('Paper tracking')}</div><h3>Actionability needs review</h3><p>Two observations did not fit your stated hours horizon. One event has incomplete timing coverage.</p><div class="card-meta">Last observed 17 Aug · 07:14 UTC <button class="text-button" data-action="open-detail">Review evidence →</button></div></article>
      <article class="review-card quiet"><div class="card-top"><div><span class="wallet-dot muted-dot"></span><strong>Harbor</strong> <span class="address">9s2…Lk8</span></div>${badge('Active')}</div><h3>Weekly review due</h3><p>No material change detected. Confirm, pause, or defer this research record.</p><div class="card-meta">Review due today <button class="text-button" data-nav="review">Open weekly review →</button></div></article>
    </div>
    <div class="panel signal-panel"><div class="panel-title"><div><p class="eyebrow">OBSERVATIONAL PAPER TRACK</p><h2>Orbit · day 3 of 7</h2></div><button class="secondary" data-nav="tracks">Open study</button></div>${trackEvents.slice(0, 3).map(eventRow).join('')}</div></section>
    <section class="quiet-state"><span>◌</span><div><strong>Keep the queue small.</strong><p>Vaultra surfaces evidence changes and review work—not a stream of market activity.</p></div></section>`;
  }

  function wallets() {
    const rows = [{ label: 'Orbit', state: 'Paper tracking', fit: 'Mixed fit', change: 'Actionability needs review', due: 'Today' }, { label: 'Harbor', state: 'Active', fit: 'Strong fit', change: 'No meaningful change', due: 'Today' }, { label: 'Haze', state: 'Needs review', fit: 'Unknown', change: 'Transfer attribution incomplete', due: '—' }, { label: 'Cedar', state: 'Paused', fit: 'Mixed fit', change: 'Paused by you', due: '—' }];
    return `<div class="page-head"><div><p class="eyebrow">RESEARCH LIST</p><h1>Wallets</h1><p class="lede">12 total records · 1 active · research state is never a recommendation.</p></div><button class="primary" data-action="open-add">Add candidate <span>+</span></button></div>
    <div class="filters"><label class="search"><span>⌕</span><input aria-label="Search wallets" placeholder="Search address, label, or note"></label><button class="filter active">All</button><button class="filter">Needs review</button><button class="filter">Paper tracking</button><button class="filter">Active</button></div>
    <div class="table-panel"><div class="table-head"><span>WALLET</span><span>STATE</span><span>PROFILE FIT</span><span>LATEST MEANINGFUL CHANGE</span><span>NEXT REVIEW</span></div>${rows.map((row) => `<button class="table-row" data-action="open-detail"><span><strong>${row.label}</strong><small>${row.label === 'Orbit' ? '7Yk9…wDemo' : 'Public address masked'}</small></span><span>${badge(row.state)}</span><span>${badge(row.fit)}</span><span>${row.change}</span><span>${row.due}</span></button>`).join('')}</div>`;
  }

  function scorecard() {
    return `<div class="detail-head"><button class="back" data-action="close-detail">← Back to Today</button><div class="page-head compact"><div><p class="eyebrow">WALLET SCORECARD · ASSESSMENT V1</p><h1><span class="wallet-dot"></span> ${wallet.label} <span class="address">${wallet.address}</span></h1><p class="lede">Last assessed ${wallet.assessed} · ${wallet.note}</p></div>${badge(wallet.state)}</div></div>
    <div class="decision-band"><div><p class="eyebrow">CURRENT DECISION</p><h2>Complete the paper track before deciding whether to keep this research record.</h2><p>Evidence is mixed and one cleanliness question remains unresolved.</p></div><button class="primary" data-nav="tracks">Open paper track</button></div>
    <div class="score-grid">${wallet.dimensions.map((dimension) => `<article class="dimension"><div class="dimension-title"><h2>${dimension.name}</h2>${badge(dimension.status)}</div><p class="confidence">Evidence confidence: <strong>${dimension.confidence}</strong></p><p class="dimension-summary">${dimension.summary}</p><dl><div><dt>Observed</dt><dd>${dimension.evidence}</dd></div><div><dt>Uncertainty</dt><dd>${dimension.counter}</dd></div></dl><button class="text-button">View evidence ledger →</button></article>`).join('')}</div>
    <section class="ledger"><div class="panel-title"><div><p class="eyebrow">PROFILE FIT</p><h2>Fits part of your stated research profile</h2></div>${badge('Mixed fit')}</div><p>Your selected response band is 30–120 minutes with an hours holding horizon. Observed events are compared to that profile only; this is not a suitability or performance claim.</p></section>`;
  }

  function eventRow(event) {
    const status = event.usability === 'Yes' ? 'Usable for stated horizon' : event.usability === 'No' ? 'Not usable' : 'Cannot assess';
    return `<div class="event-row"><div class="event-time"><strong>${event.time}</strong><span>${event.detected === '—' ? 'Detection time unavailable' : `Detected ${event.detected}`}</span></div><div><strong>${event.type}</strong><span>${event.context}</span></div><div>${badge(status)}</div><button class="text-button" data-action="event-response">Review →</button></div>`;
  }

  function tracks() {
    const summary = paperTrackSummary(trackEvents);
    return `<div class="page-head"><div><p class="eyebrow">OBSERVATIONAL STUDY</p><h1>Paper track: Orbit</h1><p class="lede">Day 3 of 7 · Started 15 Aug · profile snapshot saved</p></div>${badge('Paper tracking')}</div>
    <div class="study-question"><p class="eyebrow">STUDY QUESTION</p><h2>Can future observed activity from this wallet be noticed and researched within your declared tracking profile?</h2><div class="study-rules"><span>Response band: 30–120 min</span><span>Holding horizon: hours</span><span>Not measuring: performance or trade outcome</span></div></div>
    <div class="study-layout"><section class="timeline"><div class="panel-title"><div><p class="eyebrow">OBSERVATION TIMELINE</p><h2>4 qualifying observations</h2></div><button class="secondary" data-action="event-response">Record response</button></div>${trackEvents.map(eventRow).join('')}</section><aside class="study-summary"><p class="eyebrow">INTERIM FINDINGS</p><div class="summary-number">${summary.usableRate}<small>%</small></div><strong>usable for stated horizon</strong><dl><div><dt>Usable</dt><dd>${summary.usable}</dd></div><div><dt>Not usable</dt><dd>${summary.notUsable}</dd></div><div><dt>Cannot assess</dt><dd>${summary.cannotAssess}</dd></div></dl><p>One event lacks detection time and is excluded from latency measures.</p></aside></div>
    <div class="closing"><div><p class="eyebrow">CLOSING REVIEW</p><h2>Available in 4 days</h2><p>You can end early, extend once, or keep recording observations. A study with no events is inconclusive—not positive or negative.</p></div><button class="secondary" data-action="toast" data-message="This local prototype records no live study changes.">End early</button></div>`;
  }

  function review() {
    return `<div class="page-head"><div><p class="eyebrow">WEEKLY REVALIDATION</p><h1>Weekly review</h1><p class="lede">Compare evidence snapshots, record a human decision, and leave with a smaller clear queue.</p></div><button class="primary" data-action="toast" data-message="Review saved locally in this prototype.">Complete weekly review</button></div>
    <section class="review-layout"><div><p class="eyebrow">MATERIAL CHANGE</p><article class="comparison"><div><strong>Orbit</strong>${badge('Actionability changed')}</div><h2>Observed timing is less consistent with your hours horizon.</h2><div class="comparison-grid"><div><span>Prior assessment</span><strong>Mixed evidence</strong><p>Historical band broadly matched.</p></div><div><span>Current observation</span><strong>Needs review</strong><p>2 of 4 observations were not usable; 1 cannot assess.</p></div></div><p class="provenance">Source coverage: 3/4 qualifying events have a detection time · Study day 3 of 7</p><div class="decision-actions"><button class="choice">Keep active</button><button class="choice active-choice">Continue / re-test</button><button class="choice">Pause</button><button class="choice">Drop</button></div></article></div><aside class="review-side"><p class="eyebrow">NO MEANINGFUL CHANGE</p><h2>Harbor</h2><p>No evidence delta is available for this period. You may keep, defer, or research further without fabricating a comparison.</p><button class="secondary">Open record</button></aside></section>`;
  }

  function profile() {
    return `<div class="page-head"><div><p class="eyebrow">PROFILE & DATA</p><h1>Tracking profile</h1><p class="lede">Used only to compare observable wallet activity with your declared research workflow.</p></div></div><section class="profile-layout"><form class="profile-form"><label>Chain<select><option>Solana (MVP)</option></select></label><label>Response band<select><option>30–120 minutes</option><option>5–30 minutes</option><option>2+ hours</option></select></label><label>Holding horizon<select><option>Hours</option><option>Days</option><option>Minutes</option></select></label><label>Research focus<select><option>Swing · early runner</option><option>Discovery</option><option>Conviction</option></select></label><button class="primary" type="button" data-action="toast" data-message="Tracking profile saved locally.">Save profile</button></form><aside class="data-boundary"><p class="eyebrow">DATA BOUNDARY</p><h2>Public address only</h2><p>This prototype never asks for seed phrases, private keys, signatures, trading credentials, or portfolio balances.</p><button class="secondary">View provenance rules</button><hr><p class="muted">Live chain data is not connected. All displayed values are illustrative research data.</p></aside></section>`;
  }

  function addPanel() {
    return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="add-title"><form class="add-panel" id="candidate-form"><button class="close" type="button" data-action="close-add" aria-label="Close add candidate panel">×</button><p class="eyebrow">NEW RESEARCH RECORD</p><h2 id="add-title">Add a candidate</h2><p>Paste a public Solana address only. Never paste a seed phrase or private key.</p><label>Public Solana address<input id="candidate-address" required autocomplete="off" placeholder="Public address"></label><label>Optional label<input id="candidate-label" autocomplete="off" placeholder="e.g. Orbit"></label><div id="form-error" class="form-error" aria-live="polite"></div><div class="add-actions"><button class="secondary" type="button" data-action="close-add">Cancel</button><button class="primary" type="submit">Review candidate →</button></div></form></div>`;
  }

  function renderView() {
    let content = state.detail ? scorecard() : state.view === 'wallets' ? wallets() : state.view === 'tracks' ? tracks() : state.view === 'review' ? review() : state.view === 'profile' ? profile() : today();
    root.innerHTML = shell(content);
  }

  function toast(message) { state.toast = message; renderView(); setTimeout(() => { state.toast = ''; renderView(); }, 2600); }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-nav], [data-action]');
    if (!target) return;
    if (target.dataset.nav) { state.view = target.dataset.nav; state.detail = false; renderView(); return; }
    const action = target.dataset.action;
    if (action === 'open-add') { state.showAdd = true; renderView(); }
    if (action === 'close-add') { state.showAdd = false; renderView(); }
    if (action === 'open-detail') { state.detail = true; renderView(); }
    if (action === 'close-detail') { state.detail = false; renderView(); }
    if (action === 'event-response') toast('Observation response is recorded as illustrative local data in this prototype.');
    if (action === 'toast') toast(target.dataset.message || 'Saved locally in this prototype.');
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'candidate-form') return;
    event.preventDefault();
    const candidate = normalizeCandidate(document.getElementById('candidate-address').value, document.getElementById('candidate-label').value);
    const error = document.getElementById('form-error');
    if (!candidate) { error.textContent = 'Enter one valid public Solana address. Secret-like input is not accepted.'; return; }
    state.candidate = candidate; state.showAdd = false; state.detail = true; wallet.label = candidate.label; wallet.address = `${candidate.address.slice(0, 4)}…${candidate.address.slice(-4)}`; wallet.state = 'Candidate';
    renderView(); toast('Candidate created locally. Review evidence before starting a paper track.');
  });

  renderView();
})();
