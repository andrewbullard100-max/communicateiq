import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../../lib/auth'
import { createPortalSession } from '../../../../../lib/billing'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL
    const url = await createPortalSession({
      orgId: session.user.orgId,
      returnUrl: `${origin}/admin`,
    })
    return Response.json({ url })
  } catch (err) {
    console.error('Create portal session error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
