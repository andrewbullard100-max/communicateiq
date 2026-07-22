import { createClient } from '@supabase/supabase-js'

// ─── Server-only Supabase clients ───────────────────────────────────────────
// Two clients, two purposes:
//
// getSupabaseAdmin() — the SERVICE ROLE key, which bypasses Row Level
// Security entirely. Reserved for work that is deliberately cross-tenant by
// nature: login lookup before a session/org is known (lib/auth.js,
// lib/sso.js), Stripe webhook handlers reacting to a subscription id with no
// request-scoped user, and cron/maintenance scripts. NEVER import this into
// a client component or expose the key to the browser. If you're adding a
// new call site and the data belongs to one specific org, you almost
// certainly want getSupabaseScoped() below instead.
//
// getSupabaseScoped(orgId) — the anon/publishable key, with the caller's
// org id sent as a custom request header on every call. RLS policies (see
// migrations 001-003) read that header via
// current_setting('request.headers', true)::json->>'x-app-org-id' and scope
// every query to that org at the database level — this is what makes tenant
// isolation real instead of "every app-code query remembered to filter by
// org_id correctly." Application code should still filter by org_id/user_id
// explicitly too (see individual lib/*.js files) — that's defense in depth,
// not a substitute for RLS, but RLS is now the actual backstop.
//
// A new client is created per call rather than cached, since the org id
// header differs per request/tenant — these are cheap (no network I/O until
// the first query) so this isn't a meaningful cost.

let adminClient = null

export function getSupabaseAdmin() {
  if (adminClient) return adminClient
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured. Set them in .env.local (see DEPLOY.md).'
    )
  }
  adminClient = createClient(url, key, { auth: { persistSession: false } })
  return adminClient
}

export function getSupabaseScoped(orgId) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_ANON_KEY are not configured. Set them in .env.local (see DEPLOY.md).'
    )
  }
  if (!orgId) {
    // Fail loudly rather than silently issuing an unscoped (and therefore,
    // under RLS, empty-result) query — a caller passing undefined here is a
    // bug worth surfacing, not a query that quietly returns nothing.
    throw new Error('getSupabaseScoped() requires an orgId.')
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { 'x-app-org-id': orgId } },
  })
}

// ─── Public scenario-library read (no tenant scoping) ──────────────────────
// A minimal PostgREST fetch — deliberately not the SDK — for the one read
// that's intentionally global rather than org-scoped: platform-wide scenario
// content (scenario_families.org_id IS NULL). Used by app/api/scenarios,
// which powers both /simulation and /leadership. RLS's public-read policy
// only exposes org_id IS NULL families and status = 'approved' versions
// through the anon key, so this is safe to call with no org context.
export async function supabaseSelect(table, params) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_ANON_KEY are not configured. Set them in .env.local (see DEPLOY.md).'
    )
  }
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${url}/rest/v1/${table}?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    // Scenario content changes rarely; avoid hammering the DB on every
    // scenario-select screen load.
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`Supabase select failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}
