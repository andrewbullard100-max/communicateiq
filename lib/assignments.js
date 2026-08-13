import { getSupabaseScoped } from './supabase'

// ─── Assignment / campaign workflow ─────────────────────────────────────────
// The schema (training_tracks, training_track_items, assignments, cohorts,
// cohort_members) has existed since Phase 6 with nothing reading or writing
// it. This is the wiring that makes it real.
//
// SCOPE NOTE: an assignment's "modules" are training_track_items with a
// module_key — one of 'simulation', 'leadership', 'qbr'. Those are
// deliberately the only three: they're the only modules that currently
// persist a simulation_attempts row at all (Financial/Stakeholder/Diagnostic
// don't call /api/results yet — see app/financial, app/stakeholder,
// app/diagnostic). Assigning a module that never reports completion would
// be worse than not offering it, so scenario_family_id/pathway_id-based
// assignment items and Financial/Stakeholder/Diagnostic tracking are left
// for a follow-up once those modules persist results.
//
// Security model matches the rest of this codebase (see api/results/route.js):
// RLS on these tables is org-level isolation only (org_scope), not per-row
// user restriction — the finer-grained "who can create/see what" check is
// done at the API route layer, same as team-scope results and admin console
// access elsewhere in this app.

export const ASSIGNABLE_MODULE_KEYS = ['simulation', 'leadership', 'qbr']

export const MODULE_KEY_LABELS = {
  simulation: 'Client Role-Play Simulation',
  leadership: 'Leadership Simulation',
  qbr: 'QBR Delivery',
}

// ─── Training tracks (the "what") ───────────────────────────────────────────

export async function createTrainingTrack({ orgId, userId, name, description, moduleKeys }) {
  const invalid = (moduleKeys || []).filter(k => !ASSIGNABLE_MODULE_KEYS.includes(k))
  if (invalid.length) throw new Error(`Invalid module(s): ${invalid.join(', ')}`)
  if (!moduleKeys?.length) throw new Error('At least one module is required.')

  const db = getSupabaseScoped(orgId, userId)
  const { data: track, error } = await db
    .from('training_tracks')
    .insert({ org_id: orgId, industry_id: null, name, description: description || null })
    .select('id, name, description')
    .single()
  if (error) throw new Error(error.message)

  const items = moduleKeys.map((module_key, i) => ({ track_id: track.id, sequence: i + 1, module_key }))
  const { error: itemErr } = await db.from('training_track_items').insert(items)
  if (itemErr) throw new Error(itemErr.message)

  return { ...track, moduleKeys }
}

// ─── Target resolution ──────────────────────────────────────────────────────
// An assignment targets exactly one of: a single user, an org_unit (meaning
// that unit's entire subtree — "assign to District A" reaches every GM
// under it, matching how manager visibility already works), or a cohort.
// org_unit subtree/ancestor resolution goes through Postgres RPCs
// (org_unit_subtree_user_ids / org_unit_ancestor_ids) rather than a
// PostgREST filter, since postgrest-js can't express an ltree `<@`
// predicate directly — better to let Postgres do that work.

async function resolveOrgUnitSubtreeUserIds(db, orgUnitId) {
  const { data, error } = await db.rpc('org_unit_subtree_user_ids', { unit_id: orgUnitId })
  if (error) throw new Error(error.message)
  return (data || []).map(r => r.user_id ?? r)
}

export async function resolveAssignmentTargets(db, assignment) {
  if (assignment.target_user_id) return [assignment.target_user_id]
  if (assignment.target_org_unit_id) return resolveOrgUnitSubtreeUserIds(db, assignment.target_org_unit_id)
  if (assignment.target_cohort_id) {
    const { data, error } = await db.from('cohort_members').select('user_id').eq('cohort_id', assignment.target_cohort_id)
    if (error) throw new Error(error.message)
    return (data || []).map(r => r.user_id)
  }
  return []
}

function describeTarget(assignment, { orgUnitName, cohortName, userLabel }) {
  if (assignment.target_user_id) return userLabel || 'One person'
  if (assignment.target_org_unit_id) return orgUnitName ? `${orgUnitName} (and reports)` : 'An org unit'
  if (assignment.target_cohort_id) return cohortName ? `Cohort: ${cohortName}` : 'A cohort'
  return 'Unassigned'
}

// ─── Creating assignments ───────────────────────────────────────────────────

export async function createAssignment({
  orgId,
  userId, // caller — becomes assigned_by
  trackId,
  targetType, // 'user' | 'org_unit' | 'cohort'
  targetId,
  dueAt = null,
  passingScore = null,
  requiredAttempts = 1,
}) {
  if (!['user', 'org_unit', 'cohort'].includes(targetType)) throw new Error('Invalid target type.')
  const db = getSupabaseScoped(orgId, userId)

  const patch = {
    org_id: orgId,
    track_id: trackId,
    due_at: dueAt,
    passing_score: passingScore,
    required_attempts: requiredAttempts,
    assigned_by: userId,
    target_user_id: targetType === 'user' ? targetId : null,
    target_org_unit_id: targetType === 'org_unit' ? targetId : null,
    target_cohort_id: targetType === 'cohort' ? targetId : null,
  }

  const { data, error } = await db.from('assignments').insert(patch).select('id').single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function cancelAssignment(orgId, userId, assignmentId) {
  const db = getSupabaseScoped(orgId, userId)
  const { error } = await db.from('assignments').update({ status: 'cancelled' }).eq('id', assignmentId).eq('org_id', orgId)
  if (error) throw new Error(error.message)
  return { ok: true }
}

// ─── Admin/manager view: every assignment with a progress rollup ───────────
// "112/137 complete, 96 certified, 16 need coaching, 25 incomplete" — per
// assignment, computed from simulation_attempts joined on assignment_id +
// module_key against each target user.

export async function listOrgAssignments(orgId, userId) {
  const db = getSupabaseScoped(orgId, userId)

  const { data: assignments, error } = await db
    .from('assignments')
    .select(
      'id, due_at, passing_score, required_attempts, status, created_at, target_user_id, target_org_unit_id, target_cohort_id, ' +
      'track:training_tracks(id, name, description), ' +
      'target_user:users!assignments_target_user_id_fkey(name, email), ' +
      'target_org_unit:org_units!assignments_target_org_unit_id_fkey(name), ' +
      'target_cohort:cohorts!assignments_target_cohort_id_fkey(name)'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  if (!assignments?.length) return []

  const trackIds = [...new Set(assignments.map(a => a.track?.id).filter(Boolean))]
  let itemsByTrack = {}
  if (trackIds.length) {
    const { data: items, error: itemErr } = await db
      .from('training_track_items')
      .select('track_id, module_key, sequence')
      .in('track_id', trackIds)
      .order('sequence', { ascending: true })
    if (itemErr) throw new Error(itemErr.message)
    for (const it of items || []) (itemsByTrack[it.track_id] ||= []).push(it.module_key)
  }

  return Promise.all(
    assignments.map(async a => {
      const moduleKeys = itemsByTrack[a.track?.id] || []
      const targetUserIds = await resolveAssignmentTargets(db, a)
      const progress = await computeProgress(db, a, targetUserIds, moduleKeys)
      return {
        id: a.id,
        trackName: a.track?.name || '(untitled track)',
        moduleKeys,
        target: describeTarget(a, {
          orgUnitName: a.target_org_unit?.name,
          cohortName: a.target_cohort?.name,
          userLabel: a.target_user ? `${a.target_user.name} (${a.target_user.email})` : null,
        }),
        dueAt: a.due_at,
        passingScore: a.passing_score,
        requiredAttempts: a.required_attempts,
        createdAt: a.created_at,
        progress,
      }
    })
  )
}

// For a set of target users and a track's module keys, how many have
// completed every module (an attempt with assignment_id + matching
// module_key), and of those, how many passed the assignment's passing_score
// on their best attempt per module.
async function computeProgress(db, assignment, targetUserIds, moduleKeys) {
  if (!targetUserIds.length || !moduleKeys.length) {
    return { total: targetUserIds.length, complete: 0, certified: 0, needsCoaching: 0, incomplete: targetUserIds.length }
  }

  const { data: attempts, error } = await db
    .from('simulation_attempts')
    .select('user_id, module_key, ai_scores')
    .eq('assignment_id', assignment.id)
    .in('user_id', targetUserIds)
  if (error) throw new Error(error.message)

  const byUser = {}
  for (const a of attempts || []) {
    (byUser[a.user_id] ||= new Set()).add(a.module_key)
  }

  const passingScore = assignment.passing_score
  let complete = 0
  let certified = 0
  let needsCoaching = 0

  for (const uid of targetUserIds) {
    const done = byUser[uid] || new Set()
    const isComplete = moduleKeys.every(k => done.has(k))
    if (!isComplete) continue
    complete += 1

    if (passingScore != null) {
      const userAttempts = (attempts || []).filter(a => a.user_id === uid)
      const passed = averageScorePasses(userAttempts, passingScore)
      if (passed) certified += 1
      else needsCoaching += 1
    } else {
      certified += 1 // no passing_score set — completion alone counts as certified
    }
  }

  return {
    total: targetUserIds.length,
    complete,
    certified,
    needsCoaching,
    incomplete: targetUserIds.length - complete,
  }
}

function averageScorePasses(attempts, passingScore) {
  const allValues = attempts.flatMap(a => Object.values(a.ai_scores || {})).filter(v => typeof v === 'number')
  if (!allValues.length) return false
  const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length
  // ai_scores are 1-4; passing_score is stored as a percentage (0-100) to
  // match the rest of the app's certification language ("80%+").
  return (avg / 4) * 100 >= passingScore
}

// ─── Learner view: "my assignments" ────────────────────────────────────────
// Assignments that target this user directly, their own org_unit or an
// ancestor of it (so "assign to District A" reaches a GM two levels below),
// or a cohort they belong to.

export async function getMyAssignments(orgId, userId) {
  const db = getSupabaseScoped(orgId, userId)

  const { data: me, error: meErr } = await db.from('users').select('org_unit_id').eq('id', userId).maybeSingle()
  if (meErr) throw new Error(meErr.message)

  const { data: myCohorts, error: cohortErr } = await db.from('cohort_members').select('cohort_id').eq('user_id', userId)
  if (cohortErr) throw new Error(cohortErr.message)
  const myCohortIds = (myCohorts || []).map(c => c.cohort_id)

  let ancestorOrgUnitIds = []
  if (me?.org_unit_id) {
    const { data, error } = await db.rpc('org_unit_ancestor_ids', { unit_id: me.org_unit_id })
    if (error) throw new Error(error.message)
    ancestorOrgUnitIds = (data || []).map(r => r.id ?? r)
  }

  let query = db
    .from('assignments')
    .select(
      'id, due_at, passing_score, required_attempts, target_org_unit_id, ' +
      'track:training_tracks(id, name, description)'
    )
    .eq('status', 'active')
    .eq('org_id', orgId)

  const orFilters = [`target_user_id.eq.${userId}`]
  if (ancestorOrgUnitIds.length) orFilters.push(`target_org_unit_id.in.(${ancestorOrgUnitIds.join(',')})`)
  if (myCohortIds.length) orFilters.push(`target_cohort_id.in.(${myCohortIds.join(',')})`)
  query = query.or(orFilters.join(','))

  const { data: assignments, error } = await query
  if (error) throw new Error(error.message)
  if (!assignments?.length) return []

  const trackIds = [...new Set(assignments.map(a => a.track?.id).filter(Boolean))]
  let itemsByTrack = {}
  if (trackIds.length) {
    const { data: items, error: itemErr } = await db
      .from('training_track_items')
      .select('track_id, module_key, sequence')
      .in('track_id', trackIds)
      .order('sequence', { ascending: true })
    if (itemErr) throw new Error(itemErr.message)
    for (const it of items || []) (itemsByTrack[it.track_id] ||= []).push(it.module_key)
  }

  const assignmentIds = assignments.map(a => a.id)
  const { data: myAttempts, error: attErr } = await db
    .from('simulation_attempts')
    .select('assignment_id, module_key, ai_scores, completed_at')
    .eq('user_id', userId)
    .in('assignment_id', assignmentIds)
  if (attErr) throw new Error(attErr.message)

  return assignments.map(a => {
    const moduleKeys = itemsByTrack[a.track?.id] || []
    const myDone = new Set((myAttempts || []).filter(x => x.assignment_id === a.id).map(x => x.module_key))
    return {
      id: a.id,
      trackName: a.track?.name || '(untitled track)',
      trackDescription: a.track?.description || null,
      dueAt: a.due_at,
      passingScore: a.passing_score,
      modules: moduleKeys.map(k => ({ key: k, label: MODULE_KEY_LABELS[k] || k, complete: myDone.has(k) })),
      complete: moduleKeys.length > 0 && moduleKeys.every(k => myDone.has(k)),
    }
  })
}

// ─── Cohorts ────────────────────────────────────────────────────────────────

export async function createCohort({ orgId, userId, name, memberUserIds = [] }) {
  const db = getSupabaseScoped(orgId, userId)
  const { data: cohort, error } = await db
    .from('cohorts')
    .insert({ org_id: orgId, name, created_by: userId })
    .select('id, name')
    .single()
  if (error) throw new Error(error.message)

  if (memberUserIds.length) {
    const rows = memberUserIds.map(user_id => ({ cohort_id: cohort.id, user_id }))
    const { error: memErr } = await db.from('cohort_members').insert(rows)
    if (memErr) throw new Error(memErr.message)
  }

  return cohort
}

export async function listOrgCohorts(orgId, userId) {
  const db = getSupabaseScoped(orgId, userId)
  const { data: cohorts, error } = await db
    .from('cohorts')
    .select('id, name, created_at, cohort_members(user_id)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (cohorts || []).map(c => ({ id: c.id, name: c.name, createdAt: c.created_at, memberCount: c.cohort_members?.length || 0 }))
}

// ─── Org units (for the target picker) ─────────────────────────────────────

export async function listOrgUnits(orgId, userId) {
  const db = getSupabaseScoped(orgId, userId)
  const { data, error } = await db.from('org_units').select('id, name, parent_id, unit_type').eq('org_id', orgId).order('name')
  if (error) throw new Error(error.message)
  return data || []
}
