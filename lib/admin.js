import bcrypt from 'bcryptjs'
import { getSupabaseAdmin, getSupabaseScoped } from './supabase'
import { assertSeatAvailable } from './billing'

// ─── Admin console data layer ───────────────────────────────────────────────
// Every function here takes an explicit `orgId` and filters by it — that
// filter is the tenant boundary (see SECURITY.md → "Tenant isolation
// model"). The API routes calling these are responsible for confirming the
// caller's session role AND that the orgId they pass is the caller's own
// org — never trust an orgId from the request body/query for anything other
// than "which org does the caller belong to."

const VALID_ROLES = ['learner', 'content_author', 'content_approver', 'manager', 'org_admin', 'corporate_admin']
const VALID_STATUSES = ['invited', 'active', 'suspended', 'terminated']

export async function listOrgUsers(orgId) {
  const db = getSupabaseScoped(orgId)
  const { data: users, error } = await db
    .from('users')
    .select('id, email, name, status, org_unit_id, manager_id, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  if (!users?.length) return []

  const userIds = users.map(u => u.id)

  const { data: roleRows, error: roleErr } = await db
    .from('user_roles')
    .select('user_id, role_id')
    .in('user_id', userIds)
  if (roleErr) throw new Error(roleErr.message)

  const { data: lastLogins, error: loginErr } = await db
    .from('login_events')
    .select('user_id, created_at')
    .eq('org_id', orgId)
    .eq('success', true)
    .order('created_at', { ascending: false })
  if (loginErr) throw new Error(loginErr.message)

  const rolesByUser = {}
  for (const r of roleRows || []) {
    (rolesByUser[r.user_id] ||= []).push(r.role_id)
  }
  const lastLoginByUser = {}
  for (const l of lastLogins || []) {
    if (!lastLoginByUser[l.user_id]) lastLoginByUser[l.user_id] = l.created_at // first hit = most recent (sorted desc)
  }

  return users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    status: u.status,
    roles: rolesByUser[u.id] || [],
    managerId: u.manager_id,
    createdAt: u.created_at,
    lastLoginAt: lastLoginByUser[u.id] || null,
  }))
}

export async function createOrgUser({ orgId, orgUnitId, email, name, password, role, managerId = null }) {
  if (!VALID_ROLES.includes(role)) throw new Error(`Invalid role "${role}"`)
  await assertSeatAvailable(orgId) // throws if the org's plan seat cap is already reached
  // Deliberately the admin (service-role) client, not scoped: the email
  // uniqueness check just below has to see across ALL orgs (emails are
  // globally unique — see lib/auth.js's login lookup), which an org-scoped
  // RLS client can't do. The org_id on the insert itself is still the real
  // tenant boundary for where this row ends up.
  const db = getSupabaseAdmin()
  const normalizedEmail = email.trim().toLowerCase()

  const { data: existing } = await db.from('users').select('id').ilike('email', normalizedEmail).maybeSingle()
  if (existing) throw new Error('A user with this email already exists.')

  const passwordHash = await bcrypt.hash(password, 12)
  const { data: user, error } = await db
    .from('users')
    .insert({
      org_id: orgId,
      org_unit_id: orgUnitId,
      email: normalizedEmail,
      name,
      password_hash: passwordHash,
      manager_id: managerId,
      status: 'active',
    })
    .select('id, email, name, status')
    .single()
  if (error) throw new Error(error.message)

  const { error: roleErr } = await db.from('user_roles').insert({ user_id: user.id, role_id: role, org_unit_id: orgUnitId })
  if (roleErr) throw new Error(roleErr.message)

  return user
}

// Confirms the target user belongs to the caller's org before touching
// anything — this is what stops an org_admin at Company A from editing a
// user at Company B by guessing/enumerating a user id.
async function assertUserInOrg(db, userId, orgId) {
  const { data, error } = await db.from('users').select('id, org_id').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data || data.org_id !== orgId) throw new Error('User not found in this organization.')
}

export async function updateOrgUser(orgId, userId, { name, status, managerId, orgUnitId, roles }) {
  const db = getSupabaseScoped(orgId)
  await assertUserInOrg(db, userId, orgId)

  const patch = {}
  if (name !== undefined) patch.name = name
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) throw new Error(`Invalid status "${status}"`)
    // Reactivating a terminated user re-occupies a seat — check the cap the
    // same way createOrgUser does. Any other status transition (active <->
    // suspended, invited -> active) doesn't change the seat count, since
    // both sides of those transitions count as "occupying a seat."
    if (status !== 'terminated') {
      const { data: current } = await db.from('users').select('status').eq('id', userId).single()
      if (current?.status === 'terminated') await assertSeatAvailable(orgId)
    }
    patch.status = status
  }
  if (managerId !== undefined) patch.manager_id = managerId
  if (orgUnitId !== undefined) patch.org_unit_id = orgUnitId

  if (Object.keys(patch).length) {
    const { error } = await db.from('users').update(patch).eq('id', userId)
    if (error) throw new Error(error.message)
  }

  if (roles !== undefined) {
    const invalid = roles.filter(r => !VALID_ROLES.includes(r))
    if (invalid.length) throw new Error(`Invalid role(s): ${invalid.join(', ')}`)
    const { error: delErr } = await db.from('user_roles').delete().eq('user_id', userId)
    if (delErr) throw new Error(delErr.message)
    if (roles.length) {
      const { data: userRow } = await db.from('users').select('org_unit_id').eq('id', userId).single()
      const rows = roles.map(role_id => ({ user_id: userId, role_id, org_unit_id: userRow.org_unit_id }))
      const { error: insErr } = await db.from('user_roles').insert(rows)
      if (insErr) throw new Error(insErr.message)
    }
  }

  return { ok: true }
}

// Soft delete — sets status to 'terminated' rather than deleting the row,
// preserving simulation_attempts history for reporting (the FK would either
// block a hard delete or cascade-orphan results depending on how it's
// defined; terminated status sidesteps that question entirely).
export async function deactivateOrgUser(orgId, userId) {
  return updateOrgUser(orgId, userId, { status: 'terminated' })
}

export async function resetOrgUserPassword(orgId, userId, newPassword) {
  const db = getSupabaseScoped(orgId)
  await assertUserInOrg(db, userId, orgId)
  const passwordHash = await bcrypt.hash(newPassword, 12)
  const { error } = await db.from('users').update({ password_hash: passwordHash }).eq('id', userId)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function listRecentLoginEvents(orgId, limit = 50) {
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db
    .from('login_events')
    .select('id, user_id, email_attempted, success, reason, created_at, users(name, email)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data || []).map(e => ({
    id: e.id,
    userName: e.users?.name || null,
    email: e.users?.email || e.email_attempted,
    success: e.success,
    reason: e.reason,
    at: e.created_at,
  }))
}

export function generateTempPassword() {
  // Not cryptographically precious — this is a one-time password the admin
  // hands to the user, who should change it on first real use once
  // self-service password change ships. Readable, avoids ambiguous chars.
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}
