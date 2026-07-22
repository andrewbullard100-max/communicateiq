import { getServerSession } from 'next-auth'
import { authOptions, REVIEWER_ROLES } from '../../../../../lib/auth'
import { getAttemptForReview, submitHumanReview } from '../../../../../lib/reviews'

async function requireReviewer() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!REVIEWER_ROLES.includes(session.user.role)) {
    return { error: Response.json({ error: 'Forbidden — content_approver role or higher required' }, { status: 403 }) }
  }
  if (!session.user.orgId) return { error: Response.json({ error: 'No organization on this session' }, { status: 400 }) }
  return { session }
}

export async function GET(req, { params }) {
  const { session, error } = await requireReviewer()
  if (error) return error

  try {
    const detail = await getAttemptForReview(session.user.orgId, params.attemptId)
    return Response.json(detail)
  } catch (err) {
    console.error('Get attempt for review error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export async function POST(req, { params }) {
  const { session, error } = await requireReviewer()
  if (error) return error

  try {
    const body = await req.json()
    const result = await submitHumanReview({
      orgId: session.user.orgId,
      attemptId: params.attemptId,
      reviewerId: session.user.id,
      scores: body.scores,
      notes: body.notes,
    })
    return Response.json(result)
  } catch (err) {
    console.error('Submit human review error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
