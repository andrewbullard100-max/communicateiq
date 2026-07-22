import { purgeExpiredTranscripts } from '../../../../lib/transcripts'

// ─── Scheduled transcript purge ─────────────────────────────────────────────
// Deletes any transcript past its expires_at (retain_30_days / custom
// policies — 'until_manager_review' transcripts are purged immediately on
// review instead, see lib/transcripts.js).
//
// Excluded from the session-auth middleware (Vercel Cron has no session
// cookie); the security boundary here is the CRON_SECRET bearer check, not
// a login. Configure via vercel.json's `crons` array, which Vercel signs
// with an Authorization header automatically when CRON_SECRET is set as a
// project env var — see DEPLOY.md.
//
// getTranscript() also does a lazy per-read purge as a second line of
// defense, so a missed or misconfigured cron run doesn't mean expired
// transcripts are readable indefinitely — but the proactive cron is what
// actually keeps the table clean and the retention promise honest.

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const purgedCount = await purgeExpiredTranscripts()
    return Response.json({ ok: true, purgedCount })
  } catch (err) {
    console.error('Transcript purge error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
