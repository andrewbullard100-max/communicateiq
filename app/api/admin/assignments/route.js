import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES, TEAM_VIEW_ROLES } from '../../../../lib/auth'
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

// Broader than requireAdmin — managers can also create assignments (see the
// Team Dashboard's "Assign Training" action), but only ever targeting a
// single person, never an org_unit or cohort. createAssignment() enforces
// the actual boundary (the target person must be visible to the caller
// under the same RLS that scopes the Team Dashboard roster itself — see
// lib/assignments.js), this is just the coarse role gate.
async function requireAssigner() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!TEAM_VIEW_ROLES.includes(session.user.role)) {
    return { error: Response.json({ error: 'Forbidden — manager role or higher required' }, { status: 403 }) }
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
  const { session, error } = await requireAssigner()
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
    // Managers (not org_admin/corporate_admin) can only ever target a single
    // person, and only one visible to them — see createAssignment's
    // visibility check for the actual enforcement.
    if (!ADMIN_CONSOLE_ROLES.includes(session.user.role) && targetType !== 'user') {
      return Response.json({ error: 'Managers can only assign training to an individual person, not an org unit or cohort.' }, { status: 403 })
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

