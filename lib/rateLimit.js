import { getSupabaseAdmin } from './supabase'

// ─── Rate limiting for AI-calling routes ────────────────────────────────────
// Every call to /api/chat, /api/transcribe, /api/speak goes through here
// before it's allowed to hit Anthropic/OpenAI. One Postgres round trip per
// request (record_and_check_usage does the count + insert atomically, see
// the migration), so this adds real but small latency to every AI call —
// acceptable given the alternative is unbounded spend.
//
// Defaults are generous enough not to interrupt normal training use, but
// they exist specifically to cap the blast radius of a compromised account,
// a runaway client-side loop, or someone deliberately hammering the API.
// Override via env vars if a customer's usage pattern needs different
// numbers — this does not require a schema change, just a redeploy.

const DEFAULTS = {
  burstWindowSecs: Number(process.env.RATE_LIMIT_BURST_WINDOW_SECS) || 300, // 5 minutes
  burstLimit: Number(process.env.RATE_LIMIT_BURST_LIMIT) || 40,
  dailyLimitUser: Number(process.env.RATE_LIMIT_DAILY_USER) || 300,
  dailyLimitOrg: Number(process.env.RATE_LIMIT_DAILY_ORG) || 2000,
}

const REASON_MESSAGE = {
  burst: "You're sending requests faster than expected — pause for a few minutes and try again.",
  daily_user: "You've reached today's usage limit for this account. It resets 24 hours after your first request today — contact your admin if you need it raised.",
  daily_org: "Your organization has reached today's overall usage limit. Contact your admin.",
}

export class RateLimitError extends Error {
  constructor(reason) {
    super(REASON_MESSAGE[reason] || 'Rate limit exceeded.')
    this.reason = reason
    this.status = 429
  }
}

// Throws RateLimitError if the request should be blocked; otherwise records
// the request and returns silently. Call this BEFORE making the
// Anthropic/OpenAI call, never after — the point is to not spend money on
// requests over the limit.
export async function checkAndRecordUsage({ userId, orgId, route }) {
  if (!userId) throw new Error('checkAndRecordUsage requires a userId')
  // Admin client, deliberately: record_and_check_usage() atomically counts
  // AND writes usage in one round trip specifically to avoid a race between
  // "check" and "record" — that's the whole point of doing it as a single
  // RPC rather than two queries. It's also the one place that legitimately
  // needs to read an org-wide daily count, not just this user's own rows.
  const db = getSupabaseAdmin()

  const { data, error } = await db.rpc('record_and_check_usage', {
    p_user_id: userId,
    p_org_id: orgId || null,
    p_route: route,
    p_burst_window_secs: DEFAULTS.burstWindowSecs,
    p_burst_limit: DEFAULTS.burstLimit,
    p_daily_limit_user: DEFAULTS.dailyLimitUser,
    p_daily_limit_org: DEFAULTS.dailyLimitOrg,
  })

  if (error) {
    // Fail OPEN on a rate-limiter infrastructure error, not closed — a
    // Supabase hiccup shouldn't take down training for everyone. This is a
    // deliberate tradeoff: availability over strict enforcement for an
    // internal-tool-shaped product. Revisit if abuse becomes a real pattern.
    console.error('Rate limit check failed (failing open):', error.message)
    return
  }

  if (!data?.allowed) {
    throw new RateLimitError(data.reason)
  }
}
