import { NextResponse } from 'next/server'
import { supabaseSelect } from '../../../lib/supabase'
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

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const set = searchParams.get('set') === 'leadership' ? 'leadership' : 'client'
  const trainingTypes = set === 'leadership' ? LEADERSHIP_TRAINING_TYPES : CLIENT_TRAINING_TYPES

  try {
    const rows = await supabaseSelect('scenario_families', {
      select: 'slug,industry_id,training_type,scenario_versions!inner(title,day_label,difficulty,context,opening_line,client_persona,data_packet,success_criteria,status)',
      'org_id': 'is.null',
      'training_type': `in.(${trainingTypes.join(',')})`,
      'scenario_versions.status': 'eq.approved',
    })

    const scenarios = rows.map(row => {
      const v = row.scenario_versions[0]
      const id = row.slug.toUpperCase()
      const meta = SCENARIO_META[id] || { icon: '🎭', focus: '' }
      const base = {
        id,
        day: v.day_label,
        title: v.title,
        focus: meta.focus,
        difficulty: v.difficulty,
        icon: meta.icon,
        industry: row.industry_id,
        trainingType: row.training_type,
        context: v.context,
        dataPacket: v.data_packet,
        openingLine: v.opening_line,
        successCriteria: v.success_criteria,
      }
      // Field name differs by track to match each page's existing prop names.
      return set === 'leadership'
        ? { ...base, counterpartPersona: v.client_persona }
        : { ...base, clientPersona: v.client_persona }
    })

    return NextResponse.json({ scenarios, source: 'supabase' })
  } catch (err) {
    return NextResponse.json({ scenarios: [], source: 'error', error: String(err) }, { status: 502 })
  }
}
