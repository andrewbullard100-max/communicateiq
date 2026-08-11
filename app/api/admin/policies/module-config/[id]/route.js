import { getServerSession } from 'next-auth'
import { authOptions, REVIEWER_ROLES } from '../../../../../../lib/auth'
import { approveModuleConfig, rejectModuleConfig } from '../../../../../../lib/policies'

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!REVIEWER_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — content_approver role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    const { action } = await req.json()
    if (action === 'approve') {
      await approveModuleConfig(session.user.orgId, params.id, session.user.id)
    } else if (action === 'reject') {
      await rejectModuleConfig(session.user.orgId, params.id)
    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Module config draft review error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
