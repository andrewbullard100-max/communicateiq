# Migrating from the single-tenant (AUTH_USERS / Redis) deployment

If you have an existing CommunicateIQ deployment running on the old
`AUTH_USERS` env var + Upstash Redis model, here's what changed and how to
move over. This is a one-way migration — plan for a short maintenance
window.

## What changed

| Old | New |
|---|---|
| Users defined in `AUTH_USERS` env var (JSON blob) | Users in Supabase `users` table, scoped to an `organizations` row |
| Single `role`: `admin` or `trainee` | Six roles: `learner`, `manager`, `org_admin`, `corporate_admin`, `content_author`, `content_approver` (`user_roles` table, a user can hold more than one) |
| Simulation results in Upstash Redis (flat list, one deployment = one customer) | Results in Supabase `simulation_attempts`, scoped by `org_id` — one deployment can now serve many customers |
| Adding a user = editing an env var and redeploying | Adding a user = running `scripts/invite-user.js` (no redeploy) |

## Steps

1. **Provision Supabase.** Either use an existing project or create a new one. This repo assumes the schema already described in `SECURITY.md` exists (organizations, org_units, users, roles, user_roles, simulation_attempts, etc.) — if you're starting from scratch, those migrations need to be applied first.
2. **Create an organization** for your existing customer:
   ```bash
   node scripts/create-org.js "Existing Customer Name" <industry_id>
   ```
3. **Re-create each user** from your old `AUTH_USERS` list:
   ```bash
   node scripts/invite-user.js <orgId> <rootOrgUnitId> <email> "<Name>" "<new-password>" <role>
   ```
   Map old roles forward: `admin` → `org_admin` (or `manager`, if they should only see their own direct reports rather than the whole org — team-scope logic doesn't currently distinguish, see "Known limitations" below), `trainee` → `learner`. Passwords cannot be carried over (the old system only stored a bcrypt hash, not the plaintext) — each person needs a new password.
4. **Historical results do not migrate automatically.** The old Redis list and the new `simulation_attempts` table have different shapes (no `org_id`/`user_id` foreign keys existed on the old data). If historical scores matter, export the Redis list first and I can write a one-off backfill script — flag this if you need it before decommissioning the old Redis instance.
5. **Update environment variables** — remove `AUTH_USERS`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`; add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (see `DEPLOY.md`).
6. **Redeploy**, then test sign-in with a re-created user before decommissioning the old Redis database.

## Known limitations (as of this migration)

- **⚠️ Bug fix, read this if you deployed any earlier version:** `simulation_attempts.scenario_version_id` was `NOT NULL` since the schema was first created, but `saveAttempt()` has always passed `null` for it (the frontend never mapped scenario codes to real `scenario_versions` rows). Every simulation save has been silently failing since Phase 1, caught by `/api/results`' fail-soft error handling — the trainee's results screen worked fine, but nothing was actually being written to the database. Fixed by making the column nullable. **If you deployed and used any earlier version of this app, no historical simulation data exists — it was never saved, so there's nothing to migrate or recover.** QBR results have the same fix applied and, separately, were never even being sent to the database at all until Phase 6 (see below) — so QBR data has the same "nothing to recover" situation for a different reason.
- **Scoring validation infrastructure is now wired** (Phase 6): transcripts persist per-org retention policy, and a `content_approver`/`org_admin`/`corporate_admin` can review attempts at `/reviews` and compare AI vs. human scores. QBR delivery results are now persisted at all (previously they only ever lived in React state and vanished on page navigation).
- SSO is now wired (Phase 5) for Azure AD, Okta, and Google Workspace — but untested against a real identity provider (no live IdP access in the environment that built it). Test the full flow with real credentials before it's in front of a customer. See `SECURITY.md` → "Single Sign-On" for the full picture, especially the Okta one-app-per-customer limitation.
- SSO never auto-creates accounts — a user must already exist (via Admin Console or `invite-user.js`) before they can sign in with SSO.

- **Billing is now wired to Stripe** (Phase 4). All plans ship with `stripe_price_id = null` until you create the actual Stripe Products/Prices and update the `plans` table — see `DEPLOY.md`. Until then, the Admin Console's Billing tab shows "Contact Sales" for every plan rather than a broken "Subscribe" button.
- Existing orgs are unaffected: `subscription_status` defaults to `no_subscription` with no seat cap, so nothing about pre-Phase-4 organizations changes.
- A `past_due`/`canceled` subscription does **not** block training access today — only shows a banner in the Admin Console. That's a deliberate scope decision, not an oversight; see `SECURITY.md` → "Billing" for why.

- **AI-call rate limiting is now active** (Phase 3). If a training session for a real customer suddenly starts returning "You've reached today's usage limit" messages, check `api_usage_events` in Supabase for that user/org before assuming it's a bug — the defaults are generous but a legitimate heavy-use day could hit them. Raise via `RATE_LIMIT_*` env vars (see `DEPLOY.md`).
- **TTS voice selection changed** (Phase 3). The old `/api/speak` guessed a voice from a `speakerName` param based on a hardcoded list of "female names" — in practice no frontend page ever sent that param, so it was dead code that always fell back to `nova`. It's been replaced with an explicit `voice` param (defaulting to the neutral `alloy` if not provided). No persona currently has an assigned voice; that's a content-authoring task, not a code one, if distinct persona voices become a priority.
- Team-scope currently shows **the whole org**, not just a manager's direct reports (`org_units` hierarchy exists in the schema but isn't yet used to scope the Team Dashboard query). Fine for a single-location customer; needs a follow-up for a large multi-unit org where a manager shouldn't see every other manager's team.
- No password reset flow for end users yet — an org_admin can reset any user's password via the Admin Console (`/admin`), but a user can't reset their own without going through an admin.
