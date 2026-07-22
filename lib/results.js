import { getSupabaseScoped } from './supabase'

// ─── Persistent results storage ─────────────────────────────────────────────
// Backed by Supabase Postgres (`simulation_attempts`), scoped by org_id
// through the owning user. This replaced the old Upstash Redis flat list —
// see MIGRATING.md. Every read is filtered by org_id or user_id; that filter
// is the tenant boundary, since the service-role client bypasses RLS.

export function storageConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY)
}

// scenarioVersionId is optional: modules with seeded content (Simulation)
// can pass the real scenario_versions.id once the frontend scenario picker
// is wired to the DB (tracked separately); freeform modules (Diagnostic,
// QBR) never will. Either way we keep a human-readable label so results
// still display correctly today.
export async function saveAttempt({
  userId,
  orgId,
  scenarioVersionId = null,
  assignmentId = null,
  scenarioLabel = null,
  industry = null,
  trainingType = null,
  scores,
  certificationStatus,
  headline,
  modelVersion,
}) {
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db.from('simulation_attempts').insert({
    user_id: userId,
    scenario_version_id: scenarioVersionId,
    assignment_id: assignmentId,
    scenario_label: scenarioLabel,
    industry,
    training_type: trainingType,
    ai_scores: scores || null,
    ai_certification_status: certificationStatus || null,
    ai_headline: headline || null,
    ai_model_version: modelVersion || 'claude-haiku-4-5-20251001',
    completed_at: new Date().toISOString(),
  }).select('id').single()
  if (error) throw new Error(error.message)
  return data.id
}

function toResult(row) {
  return {
    id: row.id,
    userEmail: row.users?.email,
    userName: row.users?.name,
    scenarioTitle: row.scenario_label,
    industry: row.industry,
    trainingType: row.training_type,
    scores: row.ai_scores,
    certificationStatus: row.ai_certification_status,
    headline: row.ai_headline,
    timestamp: new Date(row.completed_at || row.created_at).getTime(),
  }
}

export async function getUserAttempts(userId, orgId) {
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db
    .from('simulation_attempts')
    .select('id, scenario_label, industry, training_type, ai_scores, ai_certification_status, ai_headline, completed_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(toResult)
}

// Team scope: every attempt from every user in the same org — this is what
// the Team Dashboard (manager/org_admin/corporate_admin only) reads.
export async function getOrgAttempts(orgId) {
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db
    .from('simulation_attempts')
    .select(
      'id, scenario_label, industry, training_type, ai_scores, ai_certification_status, ai_headline, completed_at, created_at, users!inner(email, name, org_id)'
    )
    .eq('users.org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(toResult)
}
