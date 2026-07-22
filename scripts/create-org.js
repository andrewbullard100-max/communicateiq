// Provisions a new customer organization: an `organizations` row plus a
// root `org_units` row (every org needs at least one unit — users and
// content assignments hang off org_units, not the org directly).
//
// This is the Phase 1 stand-in for a self-service signup flow. A real
// admin console (Phase 2) will do this from the browser; until then, run:
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/create-org.js "Acme University Dining" higher-ed
//
// Valid industry ids (see the `industries` table): higher-ed, healthcare,
// senior-living, k12, corporate-dining — check with scripts/list-industries.js
// or the Supabase dashboard if unsure.

const { createClient } = require('@supabase/supabase-js')

async function main() {
  const [orgName, industryId] = process.argv.slice(2)
  if (!orgName || !industryId) {
    console.error('Usage: node scripts/create-org.js "<Organization Name>" <industry_id>')
    process.exit(1)
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment first.')
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false } })

  const { data: industry, error: industryErr } = await db
    .from('industries')
    .select('id')
    .eq('id', industryId)
    .maybeSingle()
  if (industryErr) throw industryErr
  if (!industry) {
    console.error(`Unknown industry id "${industryId}". Check the industries table.`)
    process.exit(1)
  }

  const { data: org, error: orgErr } = await db
    .from('organizations')
    .insert({ name: orgName, industry: industryId })
    .select('id, name')
    .single()
  if (orgErr) throw orgErr

  const { data: unit, error: unitErr } = await db
    .from('org_units')
    .insert({ org_id: org.id, unit_type: 'root', name: orgName })
    .select('id')
    .single()
  if (unitErr) throw unitErr

  console.log('Organization created:')
  console.log(JSON.stringify({ orgId: org.id, orgName: org.name, rootOrgUnitId: unit.id }, null, 2))
  console.log('\nNext: node scripts/invite-user.js', org.id, unit.id, '<email> <name> <password> <role>')
}

main().catch(err => {
  console.error('Failed to create organization:', err.message)
  process.exit(1)
})
