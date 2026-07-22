# CommunicateIQ — Security Overview

This document summarizes the access control and data-handling model for
security or IT review. CommunicateIQ is deployed **multi-tenant**: one
application deployment (Vercel) and one Supabase Postgres database serve
every customer organization. Tenant isolation is enforced in application
code, not by separate infrastructure per customer — see "Tenant isolation
model" below for exactly how and where that boundary is drawn.

---

## Authentication

- All pages and all API routes are gated by default. There is no unauthenticated
  access to any part of the application except the sign-in page itself.
- Authentication is handled by [NextAuth.js](https://next-auth.js.org/), an
  industry-standard, actively maintained auth library used broadly in
  production Next.js applications.
- Sessions use signed, HTTP-only JWT cookies (`NEXTAUTH_SECRET`), 8-hour
  expiry — users re-authenticate daily.
- Passwords are never stored in plaintext. Each user's password is hashed
  with bcrypt (cost factor 12) before being stored in the `users.password_hash`
  column in Supabase. The application only ever compares hashes; the
  plaintext password is never persisted anywhere.
- Middleware (`middleware.js`) enforces the auth check at the edge, before
  any page or API route executes — including the OpenAI/Anthropic-calling
  routes (`/api/chat`, `/api/speak`, `/api/transcribe`), so an unauthenticated
  request cannot generate API usage or cost.

## Tenant isolation model

- Every organization is a row in `organizations`; every user belongs to
  exactly one `org_id`. All customer data — users, results, assignments,
  cohorts — is scoped by `org_id`, directly or via a foreign key chain back
  to it.
- **Tenant isolation is now enforced at the database layer via Row Level
  Security**, not by application-code filtering alone (see migrations
  `001_initial_schema.sql`, `002_rls_policies.sql`, `003_fix_rls_context_mechanism.sql`).
  Every RLS-eligible table has an `org_scope` policy requiring the row's
  `org_id` (directly, or via a join back to `users`/`simulation_attempts`)
  to match the requesting org.
- Two Supabase clients exist (`lib/supabase.js`):
  - `getSupabaseAdmin()` — the service-role key, bypasses RLS entirely.
    Reserved for pre-session lookups (`lib/auth.js`, `lib/sso.js` — org isn't
    known yet), the Stripe webhook handler (`lib/billing.js` — no request
    context at all, and subscription state is a financial control point that
    should only ever be written by a verified webhook, not any
    request-scoped client), cron/maintenance scripts, and the rate-limiter's
    atomic check-and-record RPC (needs an org-wide count, and check+record
    must be one atomic operation).
  - `getSupabaseScoped(orgId)` — the anon/publishable key, with the caller's
    org id sent as a custom `x-app-org-id` header on every request. RLS
    policies read that header via PostgREST's `request.headers` context
    (see `current_org_id()` in the migrations) and scope every query to that
    org at the database level. This is what `lib/admin.js`, `lib/reviews.js`,
    `lib/transcripts.js`, and `lib/results.js` use for anything reached after
    a session/org is established.
- Application code still filters by `org_id`/`user_id` explicitly too (e.g.
  `lib/results.js`'s `getUserAttempts`/`getOrgAttempts`) — that's defense in
  depth on top of RLS, not a substitute for it anymore.
- **Known gap — manager visibility scope:** RLS isolates by *organization*,
  not yet by org_unit/direct-reports within an org. A manager role can
  currently see every user/result in their org, not just their team. This
  is a narrower policy layered on top of what exists today (see the note at
  the bottom of `002_rls_policies.sql`) — worth a short design decision on
  the intended visibility model (org_unit subtree vs. direct-report chain)
  before encoding it, rather than guessing.
- **Known gap — no automated tenant-isolation tests.** RLS policies were
  applied and spot-checked (`pg_policies` confirms all 20 are present and
  active), but there's no regression test suite that would catch a future
  policy or schema change silently reopening a cross-tenant leak. Worth
  adding before onboarding a large or regulated customer.

## User provisioning

- **First org + first admin** for a new customer is still bootstrapped via
  CLI (`scripts/create-org.js`, `scripts/invite-user.js`) run against the
  Supabase service role key — there's no public sign-up, by design.
- **Everything after that is self-service** via the **Admin Console**
  (`/admin`), restricted to `org_admin` and `corporate_admin` roles. From
  there an org admin can add users (a one-time temp password is generated
  and shown once — never emailed, never logged), change roles, suspend or
  reactivate an account, reset a password, and view recent sign-in activity
  for their org — all without touching an env var or asking Andrew to run a
  script.
- User removal is a **soft delete** (`status = 'terminated'`), not a row
  delete — it revokes sign-in immediately while preserving that person's
  `simulation_attempts` history for team reporting.
- Every admin-console API route (`/api/admin/*`) independently re-checks
  role and scopes every query to the caller's own `org_id` server-side —
  the same "don't trust the client" pattern as `/api/results`. An org_admin
  at one customer cannot view or modify another customer's users by
  guessing an ID; `lib/admin.js`'s `assertUserInOrg` check exists
  specifically to close that off.
- Six roles exist (`roles` table): `learner`, `content_author`,
  `content_approver`, `manager`, `org_admin`, `corporate_admin`. A user can
  hold more than one, optionally scoped to a specific `org_unit` (e.g. a
  manager role scoped to one location within a multi-site customer). The
  Admin Console's role dropdown currently manages a single primary role per
  user; multi-role assignment is possible in the schema but not yet exposed
  in the UI.
- Every sign-in attempt (success or failure, with a reason) is logged to
  `login_events` and visible in the Admin Console's "Sign-In Activity" tab
  — this closes the "see login activity" gap called out at the end of
  Phase 1.

## Single Sign-On

- Azure AD (Entra ID), Okta, and Google Workspace are wired via NextAuth's
  first-class providers (`lib/auth.js`). A provider only registers if this
  deployment has its full credential set in env vars — an incomplete set is
  treated as "not configured" rather than a startup error.
- **SSO never auto-provisions accounts.** Every provider's `profile()`
  callback (`ssoProfile` in `lib/auth.js`) requires an existing, active
  `users` row matching the sign-in email before authentication succeeds. A
  person who isn't already in `users` — added via the Admin Console or
  `scripts/invite-user.js` — cannot get in via SSO no matter what their
  identity provider says. This is a deliberate "no surprise access" design:
  turning SSO on for an org can never by itself grant access to someone an
  org_admin didn't explicitly add.
- **Per-org scoping, since RLS isn't the enforcement layer here either:**
  each org sets `sso_enabled`, `sso_provider`, and a required `sso_domain`
  via the Admin Console → SSO tab. A sign-in is rejected unless the org has
  SSO enabled for that specific provider AND the email domain matches. For
  Azure AD specifically, an org can optionally also pin an `sso_tenant_id`,
  checked against the token's `tid` claim — extra defense in depth for the
  case where the Azure app registration is configured as multi-tenant (see
  the architectural note in `lib/sso.js`).
- **Every SSO sign-in attempt is logged** to the same `login_events` table
  and Admin Console "Sign-In Activity" tab as password logins, with
  SSO-specific rejection reasons (`sso_no_account`, `sso_domain_mismatch`,
  `sso_tenant_mismatch`, etc.) so a rejected sign-in is debuggable without
  digging through provider logs.
- **Architectural limitation, stated plainly:** this deployment supports one
  app registration per provider type. For Azure AD and Google, that can
  serve multiple different enterprise customers cleanly (the domain/tenant
  checks above scope them correctly). For **Okta, one app registration is
  effectively one customer** — Okta's issuer URL is customer-specific,
  unlike Azure/Google's shared endpoints. A second Okta customer needs a
  second Okta app and a second provider block in `lib/auth.js`. Past two or
  so enterprise SSO customers, especially if more than one is on Okta, the
  standard buy-vs-build answer is a dedicated multi-tenant SSO broker
  (WorkOS AuthKit is the common choice) rather than hand-rolling dynamic
  per-org OIDC provider resolution — that's specifically the problem those
  services exist to solve. Don't oversell "SSO support" as unlimited
  multi-tenant SSO without this caveat.
- **Untested against a real identity provider as of this writing** — this
  was built and verified against the database layer (user/org lookups,
  domain/tenant matching, event logging all confirmed against live
  Supabase), but the actual OAuth/OIDC round trip with Azure AD, Okta, or
  Google needs to be tested end-to-end with real credentials before it's in
  front of a customer. Flag this explicitly rather than assuming it's
  production-ready on the strength of the code review alone.

## Data handling

- Conversation transcripts and scoring are sent to Anthropic's API
  (`ANTHROPIC_API_KEY`) for evaluation and to OpenAI's API (`OPENAI_API_KEY`)
  for speech-to-text and text-to-speech. These are shared API keys for the
  whole deployment (not per-customer) — flag this if a customer's security
  review specifically requires their conversation data never transit a
  shared API key/account; that would need a per-org key configuration,
  which isn't built yet.
- Completed simulation **scores** (the 1–4 rubric scores per dimension,
  certification status, a scenario label, and a one-line AI headline) are
  persisted to Supabase (`simulation_attempts`), scoped to the user and,
  through them, their org. This is what powers the Team Dashboard's
  progress tracking and coaching flags.
- **Full conversation transcripts are now persisted per the org's
  `transcript_retention` policy** (`none` / `retain_30_days` /
  `until_manager_review` / `custom`, default `until_manager_review`) —
  wired in Phase 6. `none` is an explicit no-op; the other three policies
  compute a real expiry and are enforced by a daily Vercel Cron purge job
  plus a lazy purge-on-read, so an org that hasn't changed the default
  isn't quietly accumulating transcripts forever. See "Scoring validation"
  below for what this data is actually for.
- API keys and `SUPABASE_SERVICE_ROLE_KEY` live only in environment
  variables on the hosting platform (e.g., Vercel's encrypted environment
  variable store) — never in source control. `.env.local` is git-ignored.

## Scoring validation

- `simulation_attempts` (AI scores) and `score_reviews` (human-expert
  scores) both existed in the schema since Phase 1 but had no application
  code using them until now. A `content_approver`/`org_admin`/
  `corporate_admin` can review a completed attempt's transcript at
  `/reviews`, score it independently (the AI's scores are hidden by
  default — revealable on demand, not pre-filled, so the review isn't
  anchored on the AI's numbers), and submit a `human_expert` score_review.
- **Agreement statistics** (`/api/admin/reviews/stats`) compute the mean
  absolute difference between AI and human scores per dimension, segmented
  by training type. This is the actual data behind eventually being able to
  say "AI-scored, validated against human expert review" — see the original
  consultant assessment's "AI scoring is not yet defensible" critique for
  why this matters commercially, not just as an engineering nicety.
- This produces meaningful data only once transcripts are actually being
  retained (org default is `until_manager_review`, so this works out of the
  box) and once someone with domain expertise is actually doing reviews —
  the infrastructure doesn't make that happen on its own, and a stats page
  with n=2 reviews shouldn't be treated as a validated claim.
- **A real bug found and fixed while building this:** `simulation_attempts
  .scenario_version_id` was `NOT NULL` in the original schema, but the app
  has never mapped the frontend's static scenario codes to real
  `scenario_versions` rows — `saveAttempt()` has always passed `null` for
  it. That means **every simulation attempt save has been silently failing
  since Phase 1**, caught by `/api/results`' deliberate fail-soft error
  handling (logged, swallowed, trainee's results screen unaffected) — so
  nothing appeared broken from the UI, but nothing was actually being
  persisted either. Fixed by making the column nullable; confirmed with a
  live insert against the real schema. If you deployed any version of this
  app before this fix, no historical simulation data exists to recover —
  it was never written.

## Role-based access control

- Every session carries a `role` (the highest-priority role among any the
  user holds) and a `roles` array (the full set), set per-user via
  `user_roles`.
- The **Team Dashboard** (`/team`) — which aggregates every learner's scores
  and flags who needs coaching — is restricted to `manager`, `org_admin`,
  and `corporate_admin` roles.
- This is enforced at two layers:
  1. **Middleware** redirects sessions without one of those roles away from
     `/team` before the page ever renders (UX-layer convenience).
  2. **The API route itself** (`/api/results?scope=team`) independently
     checks the role server-side and returns a hard `403` otherwise, then
     scopes the query to the caller's own `org_id`. This is the actual
     security boundary — it holds even if someone calls the API directly
     rather than through the page, and a manager at one customer can never
     retrieve another customer's data by role alone.
- Learners can only ever read their own results (`/api/results?scope=self`
  is always scoped to the authenticated session's own `user_id` server-side
  — a learner cannot request another user's data by changing a parameter).
- **Known gap:** `getOrgAttempts` currently returns every attempt across the
  *entire org*, not just a manager's direct reports or their `org_unit`.
  The `org_units` hierarchy (with `manager_id` on `users`) exists in the
  schema to support that narrower scope but isn't used for it yet. Fine for
  a single-location customer; a follow-up item for a large multi-unit org
  where a location manager shouldn't see every other location's roster.

## Rate limiting & usage controls

- Every call to `/api/chat`, `/api/speak`, and `/api/transcribe` is checked
  against `record_and_check_usage` (a Postgres function, `lib/rateLimit.js`)
  **before** the Anthropic/OpenAI call is made — a request over any limit
  never reaches the paid API. Three limits, all overridable via env vars:
  - **Burst**: default 40 requests per user per 5 minutes — catches a
    runaway client loop or a compromised session being hammered.
  - **Daily per user**: default 300 requests per rolling 24 hours.
  - **Daily per org**: default 2000 requests per rolling 24 hours — caps
    the blast radius if several accounts at one customer are compromised or
    careless at once.
- The check and the record happen in one atomic Postgres round trip (not a
  separate count-then-insert), so concurrent requests from the same user
  can't race past the limit.
- On a rate-limiter infrastructure error (e.g. Supabase briefly
  unreachable), the check **fails open** — training isn't blocked for
  everyone by a database hiccup. This is a deliberate availability-over-
  strict-enforcement tradeoff worth revisiting if abuse becomes a real
  pattern rather than a theoretical one.
- `/api/chat`'s `max_tokens` is clamped server-side to 1500 regardless of
  what the client requests. `/api/transcribe` rejects audio files over
  10MB. Neither trusts client-supplied values as cost inputs.
- A rate-limited request returns a plain-language message (not just a raw
  429) and the frontend now surfaces it directly in the conversation instead
  of a generic "Connection error" — a learner or manager who hits a limit
  can tell what happened instead of assuming the app is broken.

## Billing

- Flat-tier subscriptions (Pilot / Growth / contact-sales Enterprise), not
  per-seat metered pricing — each plan has a flat price and a seat *cap*,
  matching how this product is actually sold. Enterprise deals are
  negotiated and invoiced manually in Stripe; there is deliberately no
  self-serve Checkout path for that tier (`plans.stripe_price_id` is null).
- Self-serve subscribe/manage happens via Stripe Checkout and the Stripe
  Billing Portal, both created server-side (`lib/billing.js`) and gated to
  `org_admin`/`corporate_admin` — the same role set as the rest of the
  Admin Console.
- **Subscription state is only ever written by the Stripe webhook**
  (`/api/stripe/webhook`), never by the app assuming a plan changed. That
  route is intentionally excluded from the session-auth middleware (Stripe
  has no session cookie); its security boundary is signature verification
  against `STRIPE_WEBHOOK_SECRET`, not a login check. A request with a
  missing or invalid signature is rejected before any handler code runs.
- **Seat limits are enforced at user creation and reactivation** —
  `createOrgUser` and `updateOrgUser` (reactivating a terminated user) both
  check the org's plan seat cap before writing. Orgs with no plan or an
  unlimited plan (`seat_limit = null`) are never capped — this includes
  every org bootstrapped via `scripts/create-org.js` before a Stripe
  subscription exists, so existing/manually-invoiced customers are never
  silently blocked by this.
- **Deliberate non-enforcement:** a `past_due`, `canceled`, or `unpaid`
  subscription status does **not** currently block training access for
  existing users — it only surfaces a banner in the Admin Console. Locking
  out an entire organization's training based on a webhook-driven status
  change is a real product decision (what happens mid-simulation? does a
  manager still need to see scores to fix the account?) that shouldn't be
  made implicitly as a side effect of wiring up billing. Flag this
  explicitly if/when hard enforcement becomes something the business wants.

## Transport security

- Vercel deployments are served over HTTPS by default (TLS termination at
  the edge). `NEXTAUTH_URL` should always be set to the `https://` production
  URL so session cookies are marked `Secure`.

## Known scope boundaries (current state)

- No self-service password reset flow for end users yet — an org_admin can
  reset any user's password via the Admin Console, but a user can't yet
  reset their own without going through an admin.
- RLS policies are not defined (see "Tenant isolation model" above) —
  tenant isolation is enforced in application code today, not the database.
- The Admin Console's role control only sets one role at a time per user
  (replacing, not adding to, their existing roles) even though the schema
  supports multiple simultaneous roles.
- Rate limits are global defaults (env vars), not configurable per customer
  from the Admin Console — a legitimate high-volume customer would need a
  manual env var change and redeploy, not a self-service setting, to raise
  their ceiling.

## Roadmap (not yet built — surface only if asked)

- Per-customer configurable rate limits (currently global env vars)
- Real RLS policies for defense-in-depth tenant isolation
- Per-org API key configuration, if a customer requires it
- Manager/org_unit-scoped Team Dashboard, Admin Console user list, and
  review queue (currently all org-wide)
- Multi-role assignment in the Admin Console UI (schema already supports it)
- Self-service password reset for end users
- End-to-end testing of SSO against real Azure AD / Okta / Google credentials (see "Single Sign-On" above)
- A second Okta app registration/provider block, if/when a second Okta enterprise customer is signed
- Multi-tenant SSO broker (e.g. WorkOS AuthKit) if enterprise SSO customer count grows past what per-provider-type app registrations comfortably support
- AI re-scoring consistency checks (same transcript, current model, logged
  as `ai_rescoring` in `score_reviews`) — would answer "does the same
  answer get the same score tomorrow," which review infrastructure alone
  doesn't
- Frontend scenario picker wired to real `scenario_versions` rows, so
  `scenario_version_id` is populated instead of always null (harmless now
  that the column is nullable, but content-linkage is still missing)
- Explicit per-persona TTS voice assignment (currently all personas use a
  single neutral default voice — see MIGRATING.md)
- Hard enforcement of subscription status on training access (currently
  billing-status is visible but not access-gating — see "Billing" above)
- Automated dunning / in-app past-due nudges beyond the Admin Console banner
