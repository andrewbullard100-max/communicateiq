import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { supabaseSelect, getSupabaseScoped } from '../../../lib/supabase'
import { SCENARIO_META } from '../../../lib/scenarioMeta'

// Client-facing (GM talking up/out to a client stakeholder) vs. leadership
// (GM talking down/across to their own team or a vendor) are distinguished
// purely by training_type — no schema flag needed for this split.
const CLIENT_TRAINING_TYPES = [
  'executive-communication', 'client-relations',
  'family-resident-relations', 'care-team-escalation', 'district-family-relations',
  'facilities-maintenance', 'facilities-housekeeping',
]
const LEADERSHIP_TRAINING_TYPES = [
  'raw-material-cost-control', 'labor-cost-management',
  'team-buy-in', 'team-accountability',
  'facilities-maintenance-leadership', 'facilities-housekeeping-leadership',
]

function mapRow(row, set, id) {
  const meta = SCENARIO_META[id] || { icon: '🎭', focus: '' }
  const base = {
    id,
    day: row.day_label,
    title: row.title,
    focus: meta.focus,
    difficulty: row.difficulty,
    icon: meta.icon,
    industry: row.industry_id,
    trainingType: row.training_type,
    context: row.context,
    dataPacket: row.data_packet,
    openingLine: row.opening_line,
    successCriteria: row.success_criteria,
  }
  return set === 'leadership'
    ? { ...base, counterpartPersona: row.client_persona }
    : { ...base, clientPersona: row.client_persona }
}

// An org's own approved custom scenarios (generated from their uploaded
// policies — see lib/policies.js) layered on top of the shared library.
// Scoped by the caller's own session org — never accepts an orgId from the
// request itself, same rule as every other org-scoped read in this repo.
async function fetchOrgScenarios(orgId, set) {
  if (!orgId) return []
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db
    .from('scenario_families')
    .select('id, industry_id, training_type, scenario_versions!inner(id, title, day_label, difficulty, context, opening_line, client_persona, data_packet, success_criteria, status)')
    .eq('org_id', orgId)
    .eq('scenario_versions.status', 'approved')
  if (error) { console.error('fetchOrgScenarios error:', error.message); return [] }

  return (data || [])
    .filter(row => set === 'leadership'
      ? LEADERSHIP_TRAINING_TYPES.includes(row.training_type)
      : CLIENT_TRAINING_TYPES.includes(row.training_type))
    .map(row => {
      const v = row.scenario_versions[0]
      // 'org-{shortId}' rather than the shared library's slug-derived id —
      // these are per-org rows, not part of the shared SCENARIO_META map.
      return mapRow({ ...v, industry_id: row.industry_id, training_type: row.training_type }, set, `org-${row.id.slice(0, 8)}`)
    })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const set = searchParams.get('set') === 'leadership' ? 'leadership' : 'client'
  const trainingTypes = set === 'leadership' ? LEADERSHIP_TRAINING_TYPES : CLIENT_TRAINING_TYPES

  try {
    const [rows, session] = await Promise.all([
      supabaseSelect('scenario_families', {
        select: 'slug,industry_id,training_type,scenario_versions!inner(title,day_label,difficulty,context,opening_line,client_persona,data_packet,success_criteria,status)',
        'org_id': 'is.null',
        'training_type': `in.(${trainingTypes.join(',')})`,
        'scenario_versions.status': 'eq.approved',
      }),
      getServerSession(authOptions),
    ])

    const sharedScenarios = rows.map(row => mapRow(row.scenario_versions[0], set, row.slug.toUpperCase()))
    const orgScenarios = await fetchOrgScenarios(session?.user?.orgId, set)

    return NextResponse.json({ scenarios: [...sharedScenarios, ...orgScenarios], source: 'supabase' })
  } catch (err) {
    return NextResponse.json({ scenarios: [], source: 'error', error: String(err) }, { status: 502 })
  }
}

