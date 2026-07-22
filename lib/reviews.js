import { getSupabaseScoped } from './supabase'
import { getTranscript, markReviewedAndPurgeIfDue } from './transcripts'

// ─── Scoring validation ─────────────────────────────────────────────────────
// This is the infrastructure behind eventually being able to say "AI-scored,
// validated against human expert review" instead of "AI-generated feedback"
// (see the original consultant assessment — this was flagged as the single
// biggest thing separating a demo from a defensible platform). It only
// produces useful data once transcripts are actually being retained
// (org.transcript_retention != 'none') and once someone with domain
// expertise is actually doing reviews — the code here just makes that
// possible, it doesn't make it happen on its own.

// Attempts that have a retained transcript and no human_expert review yet.
// This is deliberately NOT "every attempt" — an attempt with no transcript
// (retention = 'none', or expired) can't be independently reviewed at all,
// so it's excluded rather than shown as a dead end.
export async function listReviewQueue(orgId, limit = 50) {
  const db = getSupabaseScoped(orgId)

  const { data: attempts, error } = await db
    .from('simulation_attempts')
    .select('id, scenario_label, training_type, industry, ai_scores, ai_certification_status, ai_headline, completed_at, users!inner(name, email, org_id)')
    .eq('users.org_id', orgId)
    .order('completed_at', { ascending: false })
    .limit(200) // pull a working set, then filter down to unreviewed-with-transcript below
  if (error) throw new Error(error.message)
  if (!attempts?.length) return []

  const attemptIds = attempts.map(a => a.id)

  const { data: transcriptRows, error: tErr } = await db
    .from('transcripts')
    .select('attempt_id')
    .in('attempt_id', attemptIds)
    .is('reviewed_at', null)
  if (tErr) throw new Error(tErr.message)
  const hasTranscript = new Set((transcriptRows || []).map(t => t.attempt_id))

  const { data: reviewRows, error: rErr } = await db
    .from('score_reviews')
    .select('attempt_id')
    .in('attempt_id', attemptIds)
    .eq('reviewer_type', 'human_expert')
  if (rErr) throw new Error(rErr.message)
  const alreadyReviewed = new Set((reviewRows || []).map(r => r.attempt_id))

  return attempts
    .filter(a => hasTranscript.has(a.id) && !alreadyReviewed.has(a.id))
    .slice(0, limit)
    .map(a => ({
      id: a.id,
      scenarioLabel: a.scenario_label,
      trainingType: a.training_type,
      industry: a.industry,
      aiScores: a.ai_scores,
      aiCertificationStatus: a.ai_certification_status,
      aiHeadline: a.ai_headline,
      completedAt: a.completed_at,
      userName: a.users?.name,
      userEmail: a.users?.email,
    }))
}

// Confirms the attempt belongs to the caller's org before returning
// anything — same tenant-boundary pattern as lib/admin.js.
async function assertAttemptInOrg(db, attemptId, orgId) {
  const { data, error } = await db
    .from('simulation_attempts')
    .select('id, users!inner(org_id)')
    .eq('id', attemptId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data || data.users?.org_id !== orgId) throw new Error('Attempt not found in this organization.')
}

export async function getAttemptForReview(orgId, attemptId) {
  const db = getSupabaseScoped(orgId)
  await assertAttemptInOrg(db, attemptId, orgId)

  const { data: attempt, error } = await db
    .from('simulation_attempts')
    .select('id, scenario_label, training_type, industry, ai_scores, ai_certification_status, ai_headline, ai_model_version, completed_at, users(name, email)')
    .eq('id', attemptId)
    .single()
  if (error) throw new Error(error.message)

  const transcript = await getTranscript(attemptId, orgId)

  const { data: existingReviews, error: revErr } = await db
    .from('score_reviews')
    .select('id, reviewer_type, reviewer_id, model_version, scores, notes, created_at, users(name)')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: false })
  if (revErr) throw new Error(revErr.message)

  return {
    attempt: {
      id: attempt.id,
      scenarioLabel: attempt.scenario_label,
      trainingType: attempt.training_type,
      industry: attempt.industry,
      aiScores: attempt.ai_scores,
      aiCertificationStatus: attempt.ai_certification_status,
      aiHeadline: attempt.ai_headline,
      aiModelVersion: attempt.ai_model_version,
      completedAt: attempt.completed_at,
      userName: attempt.users?.name,
      userEmail: attempt.users?.email,
    },
    transcript: transcript?.content || null,
    existingReviews: (existingReviews || []).map(r => ({
      id: r.id,
      reviewerType: r.reviewer_type,
      reviewerName: r.users?.name || null,
      modelVersion: r.model_version,
      scores: r.scores,
      notes: r.notes,
      createdAt: r.created_at,
    })),
  }
}

export async function submitHumanReview({ orgId, attemptId, reviewerId, scores, notes }) {
  const db = getSupabaseScoped(orgId)
  await assertAttemptInOrg(db, attemptId, orgId)

  if (!scores || typeof scores !== 'object' || !Object.keys(scores).length) {
    throw new Error('At least one dimension score is required.')
  }

  const { error } = await db.from('score_reviews').insert({
    attempt_id: attemptId,
    reviewer_type: 'human_expert',
    reviewer_id: reviewerId,
    scores,
    notes: notes || null,
  })
  if (error) throw new Error(error.message)

  await markReviewedAndPurgeIfDue(attemptId, orgId) // honors 'until_manager_review' retention — see lib/transcripts.js
  return { ok: true }
}

// Agreement stats: for every attempt in the org that has both an AI score
// and a human_expert review, compute the mean absolute difference per
// dimension (only where both sides scored that dimension — QBR and
// role-play use different dimension keys, so this naturally segments by
// training type without needing to hardcode either one's dimension list).
export async function getAgreementStats(orgId) {
  const db = getSupabaseScoped(orgId)

  const { data: attempts, error } = await db
    .from('simulation_attempts')
    .select('id, training_type, ai_scores, users!inner(org_id)')
    .eq('users.org_id', orgId)
  if (error) throw new Error(error.message)
  if (!attempts?.length) return { reviewedCount: 0, byTrainingType: {} }

  const attemptById = Object.fromEntries(attempts.map(a => [a.id, a]))
  const attemptIds = attempts.map(a => a.id)

  const { data: reviews, error: revErr } = await db
    .from('score_reviews')
    .select('attempt_id, scores')
    .in('attempt_id', attemptIds)
    .eq('reviewer_type', 'human_expert')
  if (revErr) throw new Error(revErr.message)
  if (!reviews?.length) return { reviewedCount: 0, byTrainingType: {} }

  // dimension -> { sumAbsDiff, count } per training type
  const byTrainingType = {}

  for (const review of reviews) {
    const attempt = attemptById[review.attempt_id]
    if (!attempt?.ai_scores) continue
    const trainingType = attempt.training_type || 'unknown'
    byTrainingType[trainingType] ||= { dimensions: {}, attemptCount: 0 }
    byTrainingType[trainingType].attemptCount += 1

    for (const [dim, humanScore] of Object.entries(review.scores || {})) {
      const aiScore = attempt.ai_scores[dim]
      if (typeof aiScore !== 'number' || typeof humanScore !== 'number') continue
      byTrainingType[trainingType].dimensions[dim] ||= { sumAbsDiff: 0, count: 0 }
      byTrainingType[trainingType].dimensions[dim].sumAbsDiff += Math.abs(aiScore - humanScore)
      byTrainingType[trainingType].dimensions[dim].count += 1
    }
  }

  const summarized = {}
  for (const [trainingType, data] of Object.entries(byTrainingType)) {
    summarized[trainingType] = {
      attemptCount: data.attemptCount,
      dimensions: Object.fromEntries(
        Object.entries(data.dimensions).map(([dim, { sumAbsDiff, count }]) => [
          dim,
          { meanAbsoluteDifference: count ? +(sumAbsDiff / count).toFixed(2) : null, n: count },
        ])
      ),
    }
  }

  return { reviewedCount: reviews.length, byTrainingType: summarized }
}
