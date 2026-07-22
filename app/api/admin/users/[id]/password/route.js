import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../../../lib/auth'
import { resetOrgUserPassword, generateTempPassword } from '../../../../../../lib/admin'

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    const tempPassword = generateTempPassword()
    await resetOrgUserPassword(session.user.orgId, params.id, tempPassword)
    // Returned exactly once — hand it to the user out of band (not email/Slack in plaintext).
    return Response.json({ tempPassword })
  } catch (err) {
    console.error('Reset password error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
