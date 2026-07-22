import { getServerSession } from 'next-auth'
import { authOptions, REVIEWER_ROLES } from '../../../../../lib/auth'
import { getAgreementStats } from '../../../../../lib/reviews'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!REVIEWER_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — content_approver role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ reviewedCount: 0, byTrainingType: {} })

  try {
    const stats = await getAgreementStats(session.user.orgId)
    return Response.json(stats)
  } catch (err) {
    console.error('Get agreement stats error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
