import { getServerSession } from 'next-auth'
import { authOptions, REVIEWER_ROLES } from '../../../../../lib/auth'
import { listDraftContent } from '../../../../../lib/policies'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!REVIEWER_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — content_approver role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ scenarios: [], moduleConfig: [] })

  try {
    const drafts = await listDraftContent(session.user.orgId)
    return Response.json(drafts)
  } catch (err) {
    console.error('List draft content error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
