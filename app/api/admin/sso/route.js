import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../lib/auth'
import { listConfiguredProviders, getOrgSsoConfig, updateOrgSsoConfig } from '../../../../lib/sso'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return { error: Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 }) }
  }
  if (!session.user.orgId) return { error: Response.json({ error: 'No organization on this session' }, { status: 400 }) }
  return { session }
}

export async function GET() {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const [config, availableProviders] = await Promise.all([
      getOrgSsoConfig(session.user.orgId),
      Promise.resolve(listConfiguredProviders()),
    ])
    return Response.json({ config, availableProviders })
  } catch (err) {
    console.error('Get SSO config error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    await updateOrgSsoConfig(session.user.orgId, {
      enabled: body.enabled,
      provider: body.provider,
      domain: body.domain,
      tenantId: body.tenantId,
    })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Update SSO config error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
