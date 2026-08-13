import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../../lib/auth'
import { cancelAssignment } from '../../../../../lib/assignments'

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    const result = await cancelAssignment(session.user.orgId, session.user.id, params.id)
    return Response.json(result)
  } catch (err) {
    console.error('Cancel assignment error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
