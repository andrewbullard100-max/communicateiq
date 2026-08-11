import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { generateContentFromPolicies } from '../../../../../lib/policies'
import { checkAndRecordUsage, RateLimitError } from '../../../../../lib/rateLimit'

const GENERATE_ROLES = ['content_author', 'content_approver', 'org_admin', 'corporate_admin']

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!GENERATE_ROLES.some(r => session.user.role === r || session.user.roles?.includes(r))) {
    return Response.json({ error: 'Forbidden — content_author role or higher required' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  // Generation is a bulk, multi-call, higher-token operation — rate-limit it
  // as its own route rather than sharing the 'chat' bucket trainees use.
  try {
    await checkAndRecordUsage({ userId: session.user.id, orgId: session.user.orgId, route: 'policy_generate' })
  } catch (err) {
    if (err instanceof RateLimitError) return Response.json({ error: err.message, reason: err.reason }, { status: err.status })
    throw err
  }

  try {
    const { documentIds, industryId, serviceLine, trainingType, targets } = await req.json()
    const results = await generateContentFromPolicies({
      orgId: session.user.orgId,
      userId: session.user.id,
      documentIds, industryId, serviceLine, trainingType, targets,
    })
    return Response.json({ results })
  } catch (err) {
    console.error('Generate content from policies error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
