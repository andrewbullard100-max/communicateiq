import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { saveResult, getAllResults, getUserResults, storageConfigured } from '../../../lib/kv'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const result = {
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      scenarioId: body.scenarioId || null,
      scenarioTitle: body.scenarioTitle || null,
      industry: body.industry || null,
      trainingType: body.trainingType || null,
      scores: body.scores || null, // { clarity, data, ownership, tone, commitment } each 1-4
      certificationStatus: body.certificationStatus || null,
      headline: body.headline || null,
      timestamp: Date.now(),
    }
    await saveResult(result)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Save result error:', err)
    // Fail soft — a storage hiccup should never block the trainee from seeing
    // their own results screen, so we don't surface this as a hard error.
    return Response.json({ ok: false, warning: err.message }, { status: 200 })
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || 'self'

  if (scope === 'team') {
    // Server-side role check — this is the actual security boundary. The
    // /team page also redirects non-admins client-side, but that's UX only;
    // this check is what actually prevents a trainee from reading team data.
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin role required' }, { status: 403 })
    }
    const results = await getAllResults()
    return Response.json({ results, configured: storageConfigured() })
  }

  const results = await getUserResults(session.user.email)
  return Response.json({ results, configured: storageConfigured() })
}
