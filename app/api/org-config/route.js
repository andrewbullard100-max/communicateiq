import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { getApprovedModuleConfig } from '../../../lib/policies'

// Read-only, any authenticated org member — this is what a trainee's own
// financial/QBR page fetches to merge an org's approved custom content on
// top of the platform's static base config. Nothing here can return a
// draft: getApprovedModuleConfig only ever selects status='approved' rows.
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.orgId) return Response.json({ config: null })

  const { searchParams } = new URL(req.url)
  const module = searchParams.get('module')
  const industryId = searchParams.get('industryId')
  const serviceLine = searchParams.get('serviceLine') || 'dining'
  if (module !== 'financial' && module !== 'qbr') {
    return Response.json({ error: "module must be 'financial' or 'qbr'" }, { status: 400 })
  }
  if (!industryId) return Response.json({ error: 'industryId is required' }, { status: 400 })

  try {
    const config = await getApprovedModuleConfig(session.user.orgId, industryId, serviceLine, module)
    return Response.json({ config })
  } catch (err) {
    console.error('Get org config error:', err)
    return Response.json({ config: null, error: err.message }, { status: 200 }) // fail soft — the page falls back to base config
  }
}
