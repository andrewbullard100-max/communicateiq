import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../lib/auth'
import { listOrgAssignments, createAssignment, createTrainingTrack } from '../../../../lib/assignments'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return { error: Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 }) }
  }
  if (!session.user.orgId) {
    return { error: Response.json({ error: 'No organization on this session' }, { status: 400 }) }
  }
  return { session }
}

export async function GET() {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const assignments = await listOrgAssignments(session.user.orgId, session.user.id)
    return Response.json({ assignments })
  } catch (err) {
    console.error('List assignments error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { name, description, moduleKeys, targetType, targetId, dueAt, passingScore, requiredAttempts } = body

    if (!name || !moduleKeys?.length) {
      return Response.json({ error: 'name and at least one module are required' }, { status: 400 })
    }
    if (!targetType || !targetId) {
      return Response.json({ error: 'A target (user, org unit, or cohort) is required' }, { status: 400 })
    }

    const track = await createTrainingTrack({
      orgId: session.user.orgId,
      userId: session.user.id,
      name,
      description,
      moduleKeys,
    })

    const assignmentId = await createAssignment({
      orgId: session.user.orgId,
      userId: session.user.id,
      trackId: track.id,
      targetType,
      targetId,
      dueAt: dueAt || null,
      passingScore: passingScore ?? null,
      requiredAttempts: requiredAttempts || 1,
    })

    return Response.json({ ok: true, assignmentId, trackId: track.id })
  } catch (err) {
    console.error('Create assignment error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
