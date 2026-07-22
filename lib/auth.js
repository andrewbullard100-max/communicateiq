import CredentialsProvider from 'next-auth/providers/credentials'
import AzureADProvider from 'next-auth/providers/azure-ad'
import OktaProvider from 'next-auth/providers/okta'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from './supabase'

// ─── User store ─────────────────────────────────────────────────────────────
// Multi-tenant: users live in Supabase (`users` table), scoped to an
// `org_id`. Roles are granted per-user via `user_roles` (a user can hold
// multiple roles, optionally scoped to an org_unit). This replaced the old
// single-tenant AUTH_USERS env var — see MIGRATING.md.

const ROLE_PRIORITY = ['learner', 'content_author', 'content_approver', 'manager', 'org_admin', 'corporate_admin']

// Collapses a user's role set down to one "highest" role for the parts of
// the UI that still just need a simple gate (e.g. "can see Team Dashboard").
// The full `roles` array is also kept on the session for anything that
// needs finer-grained checks later (content approval, corporate rollups).
function highestRole(roleIds) {
  if (!roleIds || roleIds.length === 0) return 'learner'
  return roleIds.reduce(
    (best, r) => (ROLE_PRIORITY.indexOf(r) > ROLE_PRIORITY.indexOf(best) ? r : best),
    roleIds[0]
  )
}

// Roles that should be able to see cross-user data on the Team Dashboard.
export const TEAM_VIEW_ROLES = ['manager', 'org_admin', 'corporate_admin']

// Roles that can provision/deprovision users and change roles. Deliberately
// narrower than TEAM_VIEW_ROLES — a manager can see their team's scores but
// shouldn't be able to create accounts or grant org_admin to themselves.
export const ADMIN_CONSOLE_ROLES = ['org_admin', 'corporate_admin']

// Roles that can submit a human-expert score review (Phase 6 — scoring
// validation). content_approver is the domain-expertise role in the schema
// (already used for scenario content approval); org_admin/corporate_admin
// are included so a small customer without a dedicated content_approver
// isn't blocked from running validation at all.
export const REVIEWER_ROLES = ['content_approver', 'org_admin', 'corporate_admin']

async function logLoginEvent({ email, user, reason }) {
  const db = getSupabaseAdmin()
  const { error } = await db.from('login_events').insert({
    user_id: user?.id || null,
    org_id: user?.org_id || null,
    email_attempted: email,
    success: reason === 'ok',
    reason,
  })
  if (error) console.error('Login event log error:', error.message)
}

// ─── Shared SSO account-linking logic ───────────────────────────────────────
// Used as the `profile()` callback for every OAuth/OIDC provider below.
// Deliberately does NOT auto-provision new users — SSO only authenticates
// people who already have an active `users` row created via the Admin
// Console or scripts/invite-user.js. This is a "no surprise access" choice:
// SSO should never be able to grant someone access to CommunicateIQ that an
// org_admin didn't explicitly create first. See lib/sso.js for the
// multi-tenant architecture notes (this matters most for Azure AD's
// multi-tenant-app case and the sso_domain/sso_tenant_id checks below).
async function ssoProfile(providerId, profile) {
  const email = (profile.email || profile.preferred_username || profile.upn || '').trim().toLowerCase()
  const db = getSupabaseAdmin()

  if (!email) {
    throw new Error('Your identity provider did not return an email address — contact your admin.')
  }

  const { data: user, error } = await db
    .from('users')
    .select('id, org_id, org_unit_id, email, name, status, sso_subject')
    .ilike('email', email)
    .maybeSingle()
  if (error) {
    console.error('SSO auth lookup error:', error.message)
    throw new Error('Sign-in failed — please try again.')
  }

  if (!user) {
    await logLoginEvent({ email, user: null, reason: 'sso_no_account' })
    throw new Error('No CommunicateIQ account exists for this email. Ask your organization admin to add you first, then try again.')
  }
  if (user.status !== 'active') {
    await logLoginEvent({ email, user, reason: 'sso_inactive' })
    throw new Error('This account is not active.')
  }

  const { data: org, error: orgErr } = await db
    .from('organizations')
    .select('sso_enabled, sso_provider, sso_domain, sso_tenant_id')
    .eq('id', user.org_id)
    .maybeSingle()
  if (orgErr) {
    console.error('SSO org lookup error:', orgErr.message)
    throw new Error('Sign-in failed — please try again.')
  }

  if (!org?.sso_enabled || org.sso_provider !== providerId) {
    await logLoginEvent({ email, user, reason: 'sso_not_enabled' })
    throw new Error('SSO is not enabled for your organization with this provider.')
  }

  const domain = email.split('@')[1]
  if (org.sso_domain && org.sso_domain !== domain) {
    await logLoginEvent({ email, user, reason: 'sso_domain_mismatch' })
    throw new Error('Your email domain is not authorized for SSO on this organization.')
  }

  // Azure AD-specific defense in depth: if this org registered a specific
  // tenant id (relevant when the Azure app registration is multi-tenant —
  // see lib/sso.js), confirm the token's tenant claim matches. Without
  // this, sso_domain alone is the only thing stopping cross-tenant access,
  // which is usually fine (email domains on Azure AD are provider-verified)
  // but this closes the gap for orgs that want it.
  if (providerId === 'azure-ad' && org.sso_tenant_id && profile.tid && profile.tid !== org.sso_tenant_id) {
    await logLoginEvent({ email, user, reason: 'sso_tenant_mismatch' })
    throw new Error('This Microsoft account belongs to a different organization tenant than expected.')
  }

  if (!user.sso_subject && profile.sub) {
    const { error: linkErr } = await db.from('users').update({ sso_subject: profile.sub }).eq('id', user.id)
    if (linkErr) console.error('SSO subject link error:', linkErr.message)
  }

  const { data: roleRows, error: roleErr } = await db.from('user_roles').select('role_id').eq('user_id', user.id)
  if (roleErr) console.error('Role lookup error:', roleErr.message)
  const roles = [...new Set((roleRows || []).map(r => r.role_id))]

  await logLoginEvent({ email, user, reason: 'ok' })

  return {
    id: user.id,
    email: user.email,
    name: user.name || email,
    orgId: user.org_id,
    orgUnitId: user.org_unit_id,
    roles,
    role: highestRole(roles),
  }
}

// Only register a provider if this deployment actually has credentials for
// it configured — an incomplete env var set would otherwise make NextAuth
// throw at startup, or worse, register a broken sign-in button. Keep this
// list in sync with lib/sso.js's listConfiguredProviders().
const ssoProviders = []
if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
  ssoProviders.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      profile: profile => ssoProfile('azure-ad', profile),
    })
  )
}
if (process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET && process.env.OKTA_ISSUER) {
  ssoProviders.push(
    OktaProvider({
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      issuer: process.env.OKTA_ISSUER,
      profile: profile => ssoProfile('okta', profile),
    })
  )
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  ssoProviders.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile: profile => ssoProfile('google', profile),
    })
  )
}

export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8, // 8 hour session — re-authenticate daily
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.trim().toLowerCase()
        const db = getSupabaseAdmin()

        const { data: user, error } = await db
          .from('users')
          .select('id, org_id, org_unit_id, email, name, password_hash, status')
          .ilike('email', email)
          .maybeSingle()

        if (error) {
          console.error('Auth lookup error:', error.message)
          return null
        }
        if (!user || !user.password_hash) {
          await logLoginEvent({ email, user: null, reason: 'not_found' })
          return null
        }
        if (user.status !== 'active') {
          await logLoginEvent({ email, user, reason: 'inactive' }) // invited/suspended/terminated accounts can't sign in
          return null
        }

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) {
          await logLoginEvent({ email, user, reason: 'bad_password' })
          return null
        }
        await logLoginEvent({ email, user, reason: 'ok' })

        const { data: roleRows, error: roleErr } = await db
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
        if (roleErr) console.error('Role lookup error:', roleErr.message)
        const roles = [...new Set((roleRows || []).map(r => r.role_id))]

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          orgId: user.org_id,
          orgUnitId: user.org_unit_id,
          roles,
          role: highestRole(roles), // legacy single-role field for existing UI checks
        }
      },
    }),
    ...ssoProviders,
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.role = user.role
        token.roles = user.roles
        token.orgId = user.orgId
        token.orgUnitId = user.orgUnitId
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid
        session.user.role = token.role
        session.user.roles = token.roles
        session.user.orgId = token.orgId
        session.user.orgUnitId = token.orgUnitId
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    },
  },
}
