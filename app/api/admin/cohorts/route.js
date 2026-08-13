import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../lib/auth'
import { listOrgCohorts, createCohort } from '../../../../lib/assignments'

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
    const cohorts = await listOrgCohorts(session.user.orgId, session.user.id)
    return Response.json({ cohorts })
  } catch (err) {
    console.error('List cohorts error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    if (!body.name) return Response.json({ error: 'name is required' }, { status: 400 })
    const cohort = await createCohort({
      orgId: session.user.orgId,
      userId: session.user.id,
      name: body.name,
      memberUserIds: body.memberUserIds || [],
    })
    return Response.json({ cohort })
  } catch (err) {
    console.error('Create cohort error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
