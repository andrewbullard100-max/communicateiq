// Minimal server-side Supabase REST (PostgREST) client. Deliberately not the
// @supabase/supabase-js SDK — for read-only queries through RLS, a plain
// fetch() avoids an extra dependency and keeps this file trivial to audit.
//
// The anon key below is a "publishable" key by design (Supabase's own term
// for it) — it is safe to ship in server code or even client-side bundles.
// What actually protects the data is Row Level Security: the policies added
// in the org-hierarchy migration only let this key read scenario_families
// rows where org_id IS NULL and scenario_versions rows where status =
// 'approved'. Nothing customer-specific or in-progress is reachable through
// it. Override via env vars if the project or key ever changes.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://isgdzeyftlpvvqzjuzqt.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ2R6ZXlmdGxwdnZxemp1enF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMDgyMjcsImV4cCI6MjA5OTU4NDIyN30.5n4qEXjmbOBPELO4LYpSRu4eZHdgAZyln5o7uJFoKZQ'

export async function supabaseSelect(table, params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    // Scenario content changes rarely; avoid hammering the DB on every
    // scenario-select screen load.
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`Supabase select failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}
