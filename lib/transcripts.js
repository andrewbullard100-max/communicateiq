import { getSupabaseAdmin, getSupabaseScoped } from './supabase'

// ─── Transcript persistence ─────────────────────────────────────────────────
// Full conversation transcripts are NOT stored by default (see SECURITY.md).
// This module is the wiring that makes an org's transcript_retention choice
// actually do something — until now the column existed but nothing wrote to
// or read from the transcripts table. Every write here respects the owning
// org's policy; 'none' means this is a deliberate no-op, not a bug.

function computeExpiry(retentionPolicy, retentionDays) {
  const now = Date.now()
  if (retentionPolicy === 'retain_30_days') return new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
  if (retentionPolicy === 'custom' && retentionDays) return new Date(now + retentionDays * 24 * 60 * 60 * 1000).toISOString()
  return null // 'until_manager_review' has no time-based expiry — it's cleared when a review is submitted instead (see markReviewedAndPurgeIfDue)
}

export async function saveTranscriptIfRetained({ attemptId, orgId, messages }) {
  if (!messages?.length) return
  const db = getSupabaseScoped(orgId)

  const { data: org, error: orgErr } = await db
    .from('organizations')
    .select('transcript_retention, transcript_retention_days')
    .eq('id', orgId)
    .maybeSingle()
  if (orgErr) { console.error('Transcript org lookup error:', orgErr.message); return }

  const policy = org?.transcript_retention || 'until_manager_review'
  if (policy === 'none') return // explicit no-op — this org opted out of transcript retention

  const { error } = await db.from('transcripts').insert({
    attempt_id: attemptId,
    content: messages,
    retention_policy: policy,
    expires_at: computeExpiry(policy, org?.transcript_retention_days),
  })
  // Not fatal — a transcript-write failure shouldn't break the trainee's
  // results screen, which already succeeded by the time this runs.
  if (error) console.error('Transcript save error:', error.message)
}

export async function getTranscript(attemptId, orgId) {
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db
    .from('transcripts')
    .select('content, retention_policy, expires_at, reviewed_at')
    .eq('attempt_id', attemptId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Lazily purge on read rather than trusting a cron job alone to have
    // run — see scripts/purge-expired-transcripts.js / the cron route for
    // the proactive side of this.
    await db.from('transcripts').delete().eq('attempt_id', attemptId)
    return null
  }
  return data
}

// Called after a human_expert score_review is submitted. Honors the
// "until_manager_review" promise literally — once reviewed, the transcript
// is purged immediately rather than lingering.
export async function markReviewedAndPurgeIfDue(attemptId, orgId) {
  const db = getSupabaseScoped(orgId)
  const { data: transcript } = await db.from('transcripts').select('retention_policy').eq('attempt_id', attemptId).maybeSingle()
  if (!transcript) return

  if (transcript.retention_policy === 'until_manager_review') {
    const { error } = await db.from('transcripts').delete().eq('attempt_id', attemptId)
    if (error) console.error('Transcript purge-on-review error:', error.message)
  } else {
    const { error } = await db.from('transcripts').update({ reviewed_at: new Date().toISOString() }).eq('attempt_id', attemptId)
    if (error) console.error('Transcript reviewed_at update error:', error.message)
  }
}

// Bulk purge of anything past its expires_at — this is what the cron route
// and the manual fallback script both call. Safe to run as often as you
// like; it's just a delete-where-expired.
export async function purgeExpiredTranscripts() {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('transcripts')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('attempt_id')
  if (error) throw new Error(error.message)
  return data?.length || 0
}
