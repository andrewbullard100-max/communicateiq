import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../lib/auth'
import { getOrgBilling, listPlans } from '../../../../lib/billing'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    const [{ org, plan, seatsUsed }, plans] = await Promise.all([
      getOrgBilling(session.user.orgId),
      listPlans(),
    ])
    return Response.json({ org, plan, seatsUsed, plans })
  } catch (err) {
    console.error('Get billing error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
