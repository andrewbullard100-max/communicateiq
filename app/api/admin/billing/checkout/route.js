import { getServerSession } from 'next-auth'
import { authOptions, ADMIN_CONSOLE_ROLES } from '../../../../../lib/auth'
import { createCheckoutSession } from '../../../../../lib/billing'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_CONSOLE_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden — org_admin role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    const { planId } = await req.json()
    if (!planId) return Response.json({ error: 'planId is required' }, { status: 400 })

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL
    const url = await createCheckoutSession({
      orgId: session.user.orgId,
      planId,
      successUrl: `${origin}/admin?billing=success`,
      cancelUrl: `${origin}/admin?billing=canceled`,
    })
    return Response.json({ url })
  } catch (err) {
    console.error('Create checkout session error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
