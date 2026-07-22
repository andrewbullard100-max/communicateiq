# CommunicateIQ — Security Overview

This document summarizes the access control and data-handling model for
security or IT review. CommunicateIQ is deployed single-tenant: each customer
runs their own instance (their own Vercel project, their own environment
variables, their own API keys). No customer's data or credentials are ever
shared with another customer's deployment.

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
  with bcrypt (cost factor 12) before being stored in the `AUTH_USERS`
  environment variable. The application only ever compares hashes; the
  plaintext password is never persisted anywhere.
- Middleware (`middleware.js`) enforces the auth check at the edge, before
  any page or API route executes — including the OpenAI/Anthropic-calling
  routes (`/api/chat`, `/api/speak`, `/api/transcribe`), so an unauthenticated
  request cannot generate API usage or cost.

## User provisioning (current — Credentials)

- Access is admin-provisioned, not self-service. There is no public sign-up.
- The customer's own IT/training admin manages the `AUTH_USERS` list — a
  JSON array of `{ email, passwordHash, name, role }` set as a single
  environment variable in Vercel (or wherever the app is hosted).
- A CLI helper (`scripts/hash-password.js`) generates the bcrypt hash for a
  new user without ever transmitting the plaintext password anywhere.
- A `role` field (`admin` / `trainee`) is already present on every session
  object, ready for role-gating specific modules (e.g. restricting the
  Dashboard's certification-validation view to DM/admin roles) as that
  becomes a priority.

## Upgrade path — Enterprise SSO

The auth system is built on NextAuth's provider model specifically so SSO is
a configuration change, not a rebuild:

- Azure AD, Okta, and Google Workspace all have first-class NextAuth
  providers. Adding one is a few lines in `lib/auth.js` (already stubbed with
  commented examples) plus the customer's tenant/client credentials as
  environment variables.
- No changes to middleware, session handling, or any page are required —
  they already work against any NextAuth provider, credentials or SSO alike.
- This lets CommunicateIQ ship with password auth today and move a customer
  to their existing Okta/Azure AD tenant later without downtime or a
  migration project.

## Data handling

- Conversation transcripts and scoring are sent to Anthropic's API
  (`ANTHROPIC_API_KEY`) for evaluation and to OpenAI's API (`OPENAI_API_KEY`)
  for speech-to-text and text-to-speech, using each customer's own API keys.
  No conversation data is sent to, or visible from, any other customer's
  deployment or API account.
- Completed simulation **scores** (the 1–4 rubric scores per dimension,
  certification status, scenario ID, and a one-line AI headline) are
  persisted to Redis (Upstash), scoped to the user who ran the simulation.
  This is what powers the Team Dashboard's progress tracking and coaching
  flags. If Redis isn't connected, the app keeps working — scores just
  aren't saved, and the Team Dashboard shows an empty state explaining that.
- The **full conversation transcript itself is not persisted** — only the
  final scoring result. Nothing said during a simulation is stored after the
  session ends.
- API keys and the `AUTH_USERS` credential store live only in environment
  variables on the hosting platform (e.g., Vercel's encrypted environment
  variable store) — never in source control. `.env.local` is git-ignored.

## Role-based access control

- Every session carries a `role` (`admin` or `trainee`), set per-user in
  `AUTH_USERS` by whoever administers the deployment.
- The **Team Dashboard** (`/team`) — which aggregates every trainee's scores
  and flags who needs coaching — is restricted to `admin` role accounts.
- This is enforced at two layers:
  1. **Middleware** redirects non-admin sessions away from `/team` before the
     page ever renders (UX-layer convenience).
  2. **The API route itself** (`/api/results?scope=team`) independently
     checks `session.user.role === 'admin'` server-side and returns a hard
     `403` otherwise. This is the actual security boundary — it holds even
     if someone calls the API directly rather than through the page, so a
     trainee account cannot retrieve team-wide data under any circumstance.
- Trainees can only ever read their own results (`/api/results?scope=self`
  is always scoped to the authenticated session's own email server-side —
  a trainee cannot request another user's data by changing a parameter).

## Transport security

- Vercel deployments are served over HTTPS by default (TLS termination at
  the edge). `NEXTAUTH_URL` should always be set to the `https://` production
  URL so session cookies are marked `Secure`.

## Known scope boundaries (single-tenant model)

- This is not a multi-tenant SaaS — there is no cross-customer database or
  shared infrastructure to isolate, because each customer gets their own
  deployment. This eliminates an entire class of tenant-isolation risk by
  design, at the cost of each customer needing their own hosting setup
  (documented in `DEPLOY.md`).
- Rate limiting, audit logging of sign-ins, and persistent transcript storage
  are not yet implemented. Flag these explicitly to a customer's security
  team as roadmap items if they come up in a review, rather than implying
  they exist today.

## Roadmap (not yet built — surface only if asked)

- Audit log of sign-ins specifically (simulation completions ARE now logged via the results store, but raw login events are not separately logged)
- SSO provider wiring for a specific customer's identity provider
- Persistent full-transcript storage (currently only final scores are stored, not the conversation itself) for compliance/coaching review
- Finer-grained roles beyond admin/trainee (e.g. a DM role that sees their own district only, not the full roster)
