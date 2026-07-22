// Creates a user within an organization and grants them a role. Phase 1
// stand-in for a self-service admin console (Phase 2) and for real invite
// emails (Phase 2/4). Password is set directly here rather than via a
// separate hash step — bcrypt happens in this script, the plaintext is
// never written anywhere.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/invite-user.js <orgId> <orgUnitId> <email> "<Full Name>" <password> <role>
//
// Valid roles: learner, manager, org_admin, corporate_admin, content_author,
// content_approver (see the `roles` table).

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function main() {
  const [orgId, orgUnitId, email, name, password, role] = process.argv.slice(2)
  if (!orgId || !orgUnitId || !email || !name || !password || !role) {
    console.error(
      'Usage: node scripts/invite-user.js <orgId> <orgUnitId> <email> "<Full Name>" <password> <role>'
    )
    process.exit(1)
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment first.')
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false } })

  const { data: roleRow, error: roleCheckErr } = await db.from('roles').select('id').eq('id', role).maybeSingle()
  if (roleCheckErr) throw roleCheckErr
  if (!roleRow) {
    console.error(`Unknown role "${role}". Check the roles table.`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const { data: user, error: userErr } = await db
    .from('users')
    .insert({
      org_id: orgId,
      org_unit_id: orgUnitId,
      email: email.trim().toLowerCase(),
      name,
      password_hash: passwordHash,
      status: 'active',
    })
    .select('id, email')
    .single()
  if (userErr) throw userErr

  const { error: roleErr } = await db
    .from('user_roles')
    .insert({ user_id: user.id, role_id: role, org_unit_id: orgUnitId })
  if (roleErr) throw roleErr

  console.log('User created:')
  console.log(JSON.stringify({ userId: user.id, email: user.email, role }, null, 2))
}

main().catch(err => {
  console.error('Failed to create user:', err.message)
  process.exit(1)
})
