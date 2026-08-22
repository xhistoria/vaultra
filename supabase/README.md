# Supabase setup for Vaultra

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add these **server-only** variables to Vercel Preview and Production:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Never put the service-role key in browser code, Git, chat, or `NEXT_PUBLIC_*` variables. The current scanner continues to work without Supabase and reports `persistence: not_configured`; it does not fabricate history.

When configured, every successful read-only GMGN scan writes one `scan_runs` row and one `wallet_snapshots` row per candidate. Public/anon access is revoked in the checked-in schema; only the server-side service role can write.

## Current persisted fields

- chain and provider
- scan timestamp
- wallet/token observation
- realized 7D/30D evidence
- explainable score dimensions/reasons/unknowns
- coverage and surface state

Historical delta views and Telegram alerts should only be enabled after the first persisted snapshots are verified.
