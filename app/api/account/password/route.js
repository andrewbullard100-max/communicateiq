import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { changeOwnPassword } from '../../../../lib/account'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    const body = await req.json()
    if (!body.currentPassword || !body.newPassword) {
      return Response.json({ error: 'Current and new password are required.' }, { status: 400 })
    }
    const result = await changeOwnPassword(session.user.orgId, session.user.id, body.currentPassword, body.newPassword)
    return Response.json(result)
  } catch (err) {
    console.error('Change password error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
