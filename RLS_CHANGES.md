# RLS / tenant isolation — what changed and why

## Summary

Database-level Row Level Security is now the actual tenant-isolation
enforcement, not just an app-code convention. See `SECURITY.md` → "Tenant
isolation model" for the full current-state writeup; this file is the
change log for how it got there.

## Migrations (run in order against a fresh database; already applied to
## the live `CommunicateIQ` Supabase project in this order)

- `migrations/001_initial_schema.sql` — the schema reconstructed from the
  live database. Nothing existed in source control before this; a fresh
  clone could not previously reproduce the database. **Do not run this
  against the existing production project** — the tables already exist
  there. It's for new environments (staging, dev branches, disaster
  recovery) built from this repo.
- `migrations/002_rls_policies.sql` — org-scoped RLS policies on every
  tenant table, keyed off `current_org_id()`/`current_user_id()` helper
  functions.
- `migrations/003_fix_rls_context_mechanism.sql` — **required correction**
  to `002`. The original `current_org_id()`/`current_user_id()` read a
  session variable set via a separate `rpc('set_request_context', ...)`
  call. That doesn't work: PostgREST wraps every API call in its own
  transaction, so a value set by one `supabase-js` call is invisible to
  the next one. `003` redefines the same two functions to read the
  `request.headers` GUC that PostgREST sets *within* the same transaction
  as the actual query — the officially supported mechanism (see Supabase's
  "Securing your API" docs) for tenant claims when not using Supabase Auth.
  None of the `CREATE POLICY` statements from `002` needed to change, since
  they only reference the function names.

Verified directly against the live database (`set local role anon;` +
`set_config('request.headers', ...)` inside a rolled-back transaction):
correct org header → row visible; wrong or missing header → zero rows, on
both `organizations` and `users`.

## Application changes

- `lib/supabase.js` — added `getSupabaseScoped(orgId)`, an anon-key client
  that sends `x-app-org-id` as a header on every request. Kept
  `getSupabaseAdmin()` (service-role, bypasses RLS) for the call sites that
  are legitimately cross-tenant.
- `lib/admin.js`, `lib/reviews.js`, `lib/transcripts.js`, `lib/results.js`
  — switched to `getSupabaseScoped()` for tenant-scoped reads/writes. A few
  function signatures gained an `orgId` parameter where they didn't
  previously have one (`saveAttempt`, `getUserAttempts`, `getTranscript`,
  `markReviewedAndPurgeIfDue`) — their callers were updated accordingly
  (`app/api/results/route.js`).
- Deliberately **left on the admin client**, with an inline comment at
  each site explaining why:
  - `lib/auth.js`, `lib/sso.js` — org isn't known yet at login (email
    lookup is intentionally cross-org; emails are globally unique).
  - `lib/billing.js` — the Stripe webhook has no request/session context,
    and subscription/plan state should only ever be written by a verified
    webhook, not any request-scoped client, regardless of RLS.
  - `lib/rateLimit.js` — `record_and_check_usage()` is an atomic
    check-and-record RPC that also needs an org-wide daily count, not just
    the calling user's own rows.
  - `lib/transcripts.js`'s `purgeExpiredTranscripts()` — the cron/bulk job,
    intentionally cross-tenant.
  - `lib/admin.js`'s `createOrgUser()` — the pre-insert email-uniqueness
    check has to see across all orgs (emails are globally unique); the
    insert itself still sets the real `org_id`.

## New required env var

`SUPABASE_ANON_KEY` — Supabase Dashboard → Project Settings → API →
anon/public key (or a `sb_publishable_...` key). Needed alongside the
existing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`. See `DEPLOY.md`.

## Verified

- `npx next build` — compiles clean, no type/import errors from these
  changes.
- RLS policy behavior — tested directly against the live database (see
  above), not yet tested through an actual deployed request/response cycle.

## Not done yet (flagged, not silently skipped)

- **Manager visibility scope.** RLS isolates by organization only. A
  manager can currently see every user/result in their org, not just their
  own team/org_unit. Needs a design decision (org_unit subtree vs.
  direct-report chain vs. both) before encoding — see the note at the
  bottom of `migrations/002_rls_policies.sql`.
- **No automated tenant-isolation test suite.** Nothing would catch a
  future schema or policy change silently reopening a cross-tenant leak.
  Worth adding before onboarding a large or regulated customer.
- **End-to-end request test.** The RLS mechanism was verified directly in
  Postgres (simulating the `anon` role + header), not by actually running
  the Next.js app against Supabase with a real login. Recommend testing
  the admin console and results flow against a staging deploy before
  trusting this in production.
