import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../lib/auth'
import { listOrgUsers, createOrgUser, generateTempPassword } from '../../../../lib/admin'

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
    const users = await listOrgUsers(session.user.orgId)
    return Response.json({ users })
  } catch (err) {
    console.error('List org users error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { email, name, role } = body
    if (!email || !name || !role) {
      return Response.json({ error: 'email, name, and role are required' }, { status: 400 })
    }

    const tempPassword = generateTempPassword()
    const user = await createOrgUser({
      orgId: session.user.orgId,
      orgUnitId: session.user.orgUnitId,
      email,
      name,
      password: tempPassword,
      role,
      managerId: body.managerId || null,
    })

    // The temp password is returned exactly once, in this response, so the
    // admin can hand it to the new user. It is never logged or stored in
    // plaintext anywhere — only its bcrypt hash lives in the database.
    return Response.json({ user, tempPassword })
  } catch (err) {
    console.error('Create org user error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
