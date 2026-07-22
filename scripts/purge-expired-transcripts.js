// Manual fallback for scripts/purge-expired-transcripts.js — the Vercel
// Cron job (see vercel.json + app/api/internal/purge-transcripts/route.js)
// is the primary mechanism; this is for local testing or if you haven't
// set up the cron job yet.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/purge-expired-transcripts.js

const { createClient } = require('@supabase/supabase-js')

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment first.')
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await db
    .from('transcripts')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('attempt_id')

  if (error) {
    console.error('Purge failed:', error.message)
    process.exit(1)
  }

  console.log(`Purged ${data?.length || 0} expired transcript(s).`)
}

main()
