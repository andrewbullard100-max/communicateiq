import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../../lib/auth'
import { updateOrgUser, deactivateOrgUser } from '../../../../../lib/admin'

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

export async function PATCH(req, { params }) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const result = await updateOrgUser(session.user.orgId, params.id, {
      name: body.name,
      status: body.status,
      managerId: body.managerId,
      orgUnitId: body.orgUnitId,
      roles: body.roles,
    })
    return Response.json(result)
  } catch (err) {
    console.error('Update org user error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}

// Soft delete — see lib/admin.js deactivateOrgUser for why this doesn't
// hard-delete the row.
export async function DELETE(req, { params }) {
  const { session, error } = await requireAdmin()
  if (error) return error

  if (params.id === session.user.id) {
    return Response.json({ error: "You can't deactivate your own account." }, { status: 400 })
  }

  try {
    const result = await deactivateOrgUser(session.user.orgId, params.id)
    return Response.json(result)
  } catch (err) {
    console.error('Deactivate org user error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
