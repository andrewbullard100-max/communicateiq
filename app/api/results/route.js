import { getServerSession } from 'next-auth'
import { authOptions, TEAM_VIEW_ROLES } from '../../../lib/auth'
import { saveAttempt, getUserAttempts, getOrgAttempts, storageConfigured } from '../../../lib/results'
import { saveTranscriptIfRetained } from '../../../lib/transcripts'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const attemptId = await saveAttempt({
      userId: session.user.id,
      orgId: session.user.orgId,
      scenarioLabel: body.scenarioTitle || body.scenarioId || null,
      industry: body.industry || null,
      trainingType: body.trainingType || null,
      scores: body.scores || null, // { clarity, data, ownership, tone, commitment } each 1-4 (dimension keys vary by module)
      certificationStatus: body.certificationStatus || null,
      headline: body.headline || null,
    })

    // Optional — only present when the calling page sent one (simulation,
    // QBR). Silently skipped (not an error) for modules with no transcript
    // or for orgs with transcript_retention = 'none'.
    if (body.transcript?.length && session.user.orgId) {
      await saveTranscriptIfRetained({ attemptId, orgId: session.user.orgId, messages: body.transcript })
    }

    return Response.json({ ok: true, attemptId })
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

  try {
    if (scope === 'team') {
      // Server-side role check — this is the actual security boundary. The
      // /team page also redirects non-qualifying roles client-side, but
      // that's UX only; this check is what actually prevents a learner from
      // reading team data. Scoped to the caller's own org — a manager can
      // never see another organization's results, service-role client or not.
      if (!TEAM_VIEW_ROLES.includes(session.user.role)) {
        return Response.json({ error: 'Forbidden — manager role or higher required' }, { status: 403 })
      }
      if (!session.user.orgId) {
        return Response.json({ results: [], configured: storageConfigured() })
      }
      const results = await getOrgAttempts(session.user.orgId)
      return Response.json({ results, configured: storageConfigured() })
    }

    const results = await getUserAttempts(session.user.id, session.user.orgId)
    return Response.json({ results, configured: storageConfigured() })
  } catch (err) {
    console.error('Fetch results error:', err)
    return Response.json({ results: [], configured: storageConfigured(), warning: err.message }, { status: 200 })
  }
}
