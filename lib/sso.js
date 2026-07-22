import { getSupabaseAdmin } from './supabase'

// ─── SSO configuration ──────────────────────────────────────────────────────
// IMPORTANT ARCHITECTURAL NOTE — read before wiring up a second SSO customer:
//
// This deployment supports one NextAuth provider *instance* per provider
// type (one Azure AD app registration, one Okta app, one Google Workspace
// app), configured via env vars at deploy time. Whether that's "one
// customer" or "many customers" depends on the provider type:
//
// - Azure AD: if the app registration is "multi-tenant" (any organizational
//   directory), users from ANY Azure AD tenant can attempt sign-in — the
//   org's `sso_domain` (and optionally `sso_tenant_id`, checked against the
//   `tid` claim) is what scopes them to the right CommunicateIQ org. This
//   works for multiple Azure AD customers on one app registration.
// - Okta: an Okta org IS effectively a tenant — the issuer URL
//   (https://customer.okta.com) is customer-specific. One OKTA_ISSUER env
//   var means one Okta customer per deployment, full stop. A second Okta
//   customer needs a second app registration and a second NextAuth provider
//   entry (copy `lib/auth.js`'s Okta block with different env var names).
// - Google Workspace: similar to Azure — one OAuth client can serve many
//   Workspace domains; `sso_domain` is the scoping mechanism.
//
// If you cross ~2 enterprise SSO customers on providers that don't support
// this cleanly (Okta being the main one), the standard buy-vs-build answer
// is a dedicated multi-tenant SSO broker (WorkOS AuthKit is the common
// choice) rather than hand-rolling dynamic per-org OIDC provider resolution
// in NextAuth — that's genuinely what those services exist to solve.

const PROVIDER_LABELS = {
  'azure-ad': 'Microsoft Entra ID (Azure AD)',
  okta: 'Okta',
  google: 'Google Workspace',
}

// Which providers this *deployment* has credentials configured for —
// independent of which org has SSO turned on. An org can only select a
// provider from this list.
export function listConfiguredProviders() {
  const available = []
  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
    available.push({ id: 'azure-ad', label: PROVIDER_LABELS['azure-ad'] })
  }
  if (process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET && process.env.OKTA_ISSUER) {
    available.push({ id: 'okta', label: PROVIDER_LABELS.okta })
  }
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    available.push({ id: 'google', label: PROVIDER_LABELS.google })
  }
  return available
}

export async function getOrgSsoConfig(orgId) {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('organizations')
    .select('sso_enabled, sso_provider, sso_domain, sso_tenant_id')
    .eq('id', orgId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateOrgSsoConfig(orgId, { enabled, provider, domain, tenantId }) {
  if (enabled && provider) {
    const configured = listConfiguredProviders().map(p => p.id)
    if (!configured.includes(provider)) {
      throw new Error(`"${provider}" isn't configured on this deployment yet — add its env vars first (see DEPLOY.md).`)
    }
  }
  if (enabled && !domain) {
    throw new Error('An email domain is required to enable SSO (used to scope sign-ins to this organization).')
  }

  const db = getSupabaseAdmin()
  const { error } = await db
    .from('organizations')
    .update({
      sso_enabled: Boolean(enabled),
      sso_provider: provider || null,
      sso_domain: domain ? domain.trim().toLowerCase().replace(/^@/, '') : null,
      sso_tenant_id: tenantId || null,
    })
    .eq('id', orgId)
  if (error) throw new Error(error.message)
}
