function createPersistence({ env = process.env, fetchImpl = fetch } = {}) {
  const baseUrl = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  async function insert(table, rows) {
    const response = await fetchImpl(`${baseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=ignore-duplicates',
      },
      body: JSON.stringify(rows),
    });
    if (!response.ok) throw new Error(`supabase_${response.status}`);
    return response.json();
  }

  return {
    async getPreviousSnapshots({ chain, addresses }) {
      if (!baseUrl || !serviceKey || !addresses.length) return [];
      try {
        const params = new URLSearchParams({ select: 'wallet_address,score,evidence,created_at', chain: `eq.${chain}`, wallet_address: `in.(${addresses.join(',')})`, order: 'created_at.desc', limit: String(addresses.length * 2) });
        const response = await fetchImpl(`${baseUrl}/rest/v1/wallet_snapshots?${params}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
        if (!response.ok) return [];
        return await response.json();
      } catch { return []; }
    },
    async persistScan({ chain, generatedAt, candidates }) {
      if (!baseUrl || !serviceKey) return { status: 'not_configured' };
      try {
        const runs = await insert('scan_runs', [{ chain, provider: 'gmgn', generated_at: generatedAt, candidate_count: candidates.length }]);
        const runId = runs?.[0]?.id;
        if (!runId) return { status: 'error', reason: 'database_invalid_response' };
        if (candidates.length) {
          await insert('wallet_snapshots', candidates.map((candidate) => ({
            scan_run_id: runId,
            chain,
            wallet_address: candidate.address,
            token_address: candidate.tokenAddress,
            token_symbol: candidate.token,
            observed_amount_usd: candidate.observedAmountUsd,
            observed_at: candidate.observedAt ? new Date(candidate.observedAt * 1000).toISOString() : null,
            surface_state: candidate.surfaceState,
            score: candidate.score || null,
            evidence: candidate.evidence || {},
          })));
        }
        return { status: 'persisted', runId, candidateCount: candidates.length };
      } catch {
        return { status: 'error', reason: 'database_unavailable' };
      }
    },
  };
}

module.exports = { createPersistence };
