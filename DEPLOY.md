# CommunicateIQ Executive Communication Training Platform
## Deployment Guide

---

## PREREQUISITES
- Node.js installed (nodejs.org — download LTS version)
- Anthropic API key (console.anthropic.com → API Keys)
- GitHub account (github.com — free)
- Vercel account (vercel.com — free, sign in with GitHub)

---

## STEP 1 — Set Up the Project

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# Navigate to where you want the project
cd Desktop

# Copy the project folder here, then install dependencies
cd communicateiq-training
npm install
```

---

## STEP 2 — Add Your API Keys, Database & Access Control

CommunicateIQ is now multi-tenant: users, roles, and results live in
Supabase Postgres instead of an env var, and a single deployment can serve
many customer organizations at once.

Create a file called `.env.local` in the project root folder.
Add these lines (replace with your actual values):

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-openai-key-here

NEXTAUTH_SECRET=generate-a-random-string-here
NEXTAUTH_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-or-publishable-key-here

STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here

CRON_SECRET=generate-another-random-string-here

# Optional — only add credentials for the identity providers you actually
# need. A provider only appears as a sign-in option (and as a selectable
# option in the Admin Console's SSO tab) if ALL of its variables are set.
# AZURE_AD_CLIENT_ID=
# AZURE_AD_CLIENT_SECRET=
# AZURE_AD_TENANT_ID=
# OKTA_CLIENT_ID=
# OKTA_CLIENT_SECRET=
# OKTA_ISSUER=https://your-customer.okta.com
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Optional — override the default AI-call rate limits (see SECURITY.md).
# Safe to omit; sensible defaults apply automatically.
# RATE_LIMIT_BURST_WINDOW_SECS=300
# RATE_LIMIT_BURST_LIMIT=40
# RATE_LIMIT_DAILY_USER=300
# RATE_LIMIT_DAILY_ORG=2000
```

**Set up scoring validation (Phase 6):**

1. Add `CRON_SECRET` (any random string) to your env vars — Vercel automatically sends it as a Bearer token when it triggers the cron job defined in `vercel.json`, which purges expired transcripts daily. Nothing else to configure; the cron job registers itself on deploy.
2. Transcripts persist according to each org's `transcript_retention` setting (`organizations` table — no UI for this yet, set via SQL: `update organizations set transcript_retention = 'retain_30_days' where id = '...'`). The default, `until_manager_review`, works out of the box: transcripts are kept until a `content_approver`/`org_admin`/`corporate_admin` reviews that attempt at `/reviews`, then purged immediately.
3. Grant someone the `content_approver` role (via Admin Console → Users, or `invite-user.js`) to actually do reviews — `org_admin`/`corporate_admin` can also review, but a dedicated reviewer is the intended long-term setup.
4. Agreement stats (`/reviews` → Validation Stats tab) need a real sample size before they mean anything — don't cite a stat built on 2-3 reviews as a validated claim.

**Set up SSO (Phase 5) — read this before promising a customer "SSO support":**

CommunicateIQ supports Azure AD (Microsoft Entra ID), Okta, and Google Workspace via NextAuth. Important limitation before you sell this: **one deployment supports one app registration per provider type.** For Azure AD and Google, that can serve multiple different enterprise customers (their domain + our per-org SSO settings scope them correctly). For **Okta specifically, one Okta app registration effectively serves one customer** — Okta's issuer URL is customer-specific, unlike Azure/Google's shared OAuth endpoints. A second Okta customer needs a second app registration and a second provider block copy-pasted into `lib/auth.js` with different env var names. If you cross two or more enterprise SSO customers, especially on Okta, look at a dedicated multi-tenant SSO broker (WorkOS AuthKit is the standard buy-vs-build answer here) rather than hand-rolling more of this — see `lib/sso.js` for the full explanation.

1. Register an OAuth app with whichever provider your customer uses:
   - **Azure AD**: Azure Portal → App registrations → New registration. Redirect URI: `https://your-domain/api/auth/callback/azure-ad`. Grab the Application (client) ID, a client secret (Certificates & secrets), and the Directory (tenant) ID.
   - **Okta**: Okta Admin Console → Applications → Create App Integration → OIDC. Redirect URI: `https://your-domain/api/auth/callback/okta`. Grab the Client ID, Client Secret, and your Okta domain as the issuer (`https://your-customer.okta.com`).
   - **Google Workspace**: Google Cloud Console → Credentials → OAuth client ID (Web application). Redirect URI: `https://your-domain/api/auth/callback/google`.
2. Add the matching env vars above, redeploy.
3. In the Admin Console → SSO tab (org_admin/corporate_admin), turn SSO on for the customer's org, pick the provider, and set the required email domain (e.g. `acme.edu`) — this is what stops someone else's account on the same identity provider from reaching an unrelated org.
4. **SSO never auto-creates accounts.** A person must already have an active `users` row (added via the Admin Console or `invite-user.js`) before they can sign in with SSO — this is intentional, so turning SSO on can't silently grant access to anyone an org_admin didn't explicitly add first.
5. Test the full sign-in flow yourself before handing it to a customer — I could not test this against a real identity provider in the environment that built it; verify the redirect URI, the domain check, and that an existing user can actually complete sign-in end to end.

⚠️ Existing organizations default to SSO disabled — nothing changes for anyone until an org_admin explicitly turns it on for their org.

**Set up Stripe billing (Phase 4):**

1. In the Stripe Dashboard, create two Products — one for the Pilot plan, one for Growth — each with a recurring monthly Price. Enterprise deals stay off self-serve on purpose (see `lib/billing.js`); don't create a Price for it.
2. Copy each Price ID (`price_...`) and update the `plans` table in Supabase:
   ```sql
   update plans set stripe_price_id = 'price_xxx' where id = 'pilot';
   update plans set stripe_price_id = 'price_yyy' where id = 'growth';
   ```
   Until you do this, both plans show a "Contact Sales" link instead of a "Subscribe" button in the Admin Console — self-serve checkout is disabled for any plan without a price ID, by design, rather than silently failing.
3. Get your Stripe **secret key** (Developers → API keys → Secret key) for `STRIPE_SECRET_KEY`. Use a test-mode key (`sk_test_...`) until you're ready to charge real customers.
4. Set up the webhook: Developers → Webhooks → Add endpoint → `https://your-domain/api/stripe/webhook`, subscribed to at minimum: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`. Copy the **signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
5. Test with Stripe's test card `4242 4242 4242 4242` (any future expiry, any CVC) before going live. Use `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI) to test webhooks locally.

⚠️ Existing organizations created before this migration (via `create-org.js`) default to `subscription_status = 'no_subscription'` with no seat limit — nothing about their access changes. Billing is additive; it doesn't retroactively gate anyone.
```

**Generate `NEXTAUTH_SECRET`** (any long random string works):
```bash
openssl rand -base64 32
```

**Get your Supabase values:**
1. `SUPABASE_URL` — Supabase Dashboard → Project Settings → API → Project URL
2. `SUPABASE_SERVICE_ROLE_KEY` — same page → **service_role** secret key (NOT the anon/publishable key — the service role key bypasses Row Level Security and is reserved for pre-session lookups, the Stripe webhook, and cron scripts; never expose it to the browser or commit it to git)
3. `SUPABASE_ANON_KEY` — same page → **anon/public** key (legacy JWT-based) or a **publishable** key (`sb_publishable_...`). Used server-side by `getSupabaseScoped()` for all per-request, tenant-scoped queries once a session/org is known — Row Level Security policies enforce the org boundary on this key. Safe to be public (it's the same key that's traditionally safe to ship to a browser), but this app never sends it to the browser; it stays server-side alongside the service-role key.

**Create your first organization and admin user:**
```bash
node scripts/create-org.js "Your Company Name" higher-ed
# prints an orgId and rootOrgUnitId — use them below

node scripts/invite-user.js <orgId> <rootOrgUnitId> you@client.com "Your Name" "your-password" org_admin
```
Repeat `invite-user.js` for each additional person, choosing a role of
`learner`, `manager`, `org_admin`, `corporate_admin`, `content_author`, or
`content_approver`. `manager`, `org_admin`, and `corporate_admin` can see
the Team Dashboard; the rest cannot. See `SECURITY.md` for the full access
control model, and `MIGRATING.md` if you're moving off an old single-tenant
`AUTH_USERS` deployment.

⚠️ IMPORTANT: Never share the `.env.local` file or commit it to GitHub.
The .gitignore file already excludes it. Never send plaintext passwords over
email or Slack — share the org/user creation commands with whoever is
provisioning access, or better, have each person set their own password
after their first login once self-service password reset ships (Phase 2).

---

## STEP 3 — Test Locally

```bash
npm run dev
```

Open your browser to: http://localhost:3000

You'll land on the sign-in page first — log in with the user you created via `scripts/invite-user.js`. Test all five modules work before deploying.

---

## STEP 4 — Deploy to Vercel (for shareable URL)

### 4a. Push to GitHub

```bash
# Initialize git (first time only)
git init
git add .
git commit -m "Initial deploy"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/communicateiq-training.git
git push -u origin main
```

### 4b. Connect to Vercel

1. Go to vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your communicateiq-training repository
4. In the "Environment Variables" section, add all the variables from Step 2:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` — set this to your production URL (e.g. `https://communicateiq-training.vercel.app`) once you know it; you can redeploy after the first deploy to update it
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` — note: register the webhook endpoint (Step 2, item 4) against your production URL, not localhost, once you know it; the signing secret differs per endpoint
   - `CRON_SECRET`
5. Click "Deploy"

Vercel gives you a URL like: `communicateiq-training.vercel.app`

That URL is now behind a login screen — only people provisioned via `scripts/invite-user.js` can get in. Because every environment points at the same Supabase project, running the provisioning scripts once (locally, pointed at your production Supabase credentials) grants access on the live site — no redeploy needed to add a customer org or a user.

---

## STEP 5 — Custom Domain (Optional)

In Vercel dashboard → Settings → Domains
Add any domain you own, or use the free `.vercel.app` URL.

---

## FOR THE DEMO MEETING

Recommended demo flow (8-10 minutes):

1. **Home page** — show the full platform structure (1 min)
2. **Diagnostic** — fill in a few ratings, hit submit, show AI analysis (2 min)
3. **Stakeholder Map** — show the informal influencer section, explain the requirement (1 min)
4. **Simulation** — run D2-S1 (CFO Labor Challenge), type a weak first response to show pushback, then a strong response, hit End & Score (3 min)
5. **QBR** — show the builder structure, then the boardroom delivery concept (1 min)
6. **Dashboard** — show the 45-day certification tracker and DM validation tab (1 min)

---

## TROUBLESHOOTING

**"Module not found" error:** Run `npm install` again

**API errors in browser:** Check that .env.local exists with correct key format

**Blank page:** Check browser console for errors (F12)

**Vercel deploy fails:** Confirm ANTHROPIC_API_KEY, OPENAI_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, and STRIPE_WEBHOOK_SECRET are all set in Vercel environment variables

**Stuck redirecting to /login even with correct password:** Confirm `NEXTAUTH_URL` matches the URL you're actually visiting (http vs https, correct domain) — a mismatch breaks the session cookie

**"Incorrect email or password" for a valid user:** Confirm the user exists in the `users` table with `status = 'active'` and the email matches exactly (case-insensitive) — check via the Supabase dashboard or `select * from users where email ilike '...'`

---

## COST ESTIMATE

Anthropic API usage for a demo session (10-15 AI calls):
~$0.05-0.15 per session using claude-opus-4-5

For enterprise deployment pricing, see: console.anthropic.com/settings/billing
