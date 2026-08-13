import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { getMyAssignments } from '../../../lib/assignments'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.orgId) return Response.json({ assignments: [] })

  try {
    const assignments = await getMyAssignments(session.user.orgId, session.user.id)
    return Response.json({ assignments })
  } catch (err) {
    console.error('Get my assignments error:', err)
    return Response.json({ assignments: [], warning: err.message }, { status: 200 })
  }
}
