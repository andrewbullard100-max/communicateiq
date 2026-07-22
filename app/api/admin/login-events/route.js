import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../lib/auth'
import { listRecentLoginEvents } from '../../../../lib/admin'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ events: [] })

  try {
    const events = await listRecentLoginEvents(session.user.orgId, 50)
    return Response.json({ events })
  } catch (err) {
    console.error('List login events error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
