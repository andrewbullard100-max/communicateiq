import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../lib/auth'
import { listOrgUnits } from '../../../../lib/assignments'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ orgUnits: [] })

  try {
    const orgUnits = await listOrgUnits(session.user.orgId, session.user.id)
    return Response.json({ orgUnits })
  } catch (err) {
    console.error('List org units error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
