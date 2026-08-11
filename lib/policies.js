import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseScoped } from './supabase'
import { extractText } from './extractText'
import { INDUSTRY_CONFIG, SERVICE_LINE_CONFIG } from './data'

// ─── Org custom content: policy upload + AI generation ─────────────────────
// Same tenant-boundary pattern as lib/admin.js / lib/reviews.js — every
// function takes an explicit orgId, uses getSupabaseScoped(orgId), and RLS
// (migrations/004_org_custom_content.sql) is the actual backstop.
//
// Generated content (scenarios, rubrics, financial/QBR config) is always
// written with status='draft'. Nothing here ever writes 'approved' — that
// transition is a separate, explicit human action (approveGeneratedContent
// below), same review gate the schema already had for scenario_versions.

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const GENERATION_MODEL = 'claude-sonnet-5'

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8MB — Netlify's function payload ceiling is the binding constraint here, not the parser; see note in DEPLOY.md if larger policy PDFs need to go straight to Storage instead.
const MAX_POLICY_CHARS_PER_DOC = 40000 // ~10k tokens/doc; keeps a multi-document generation call within a reasonable prompt size

// ─── Upload ──────────────────────────────────────────────────────────────────

export async function uploadPolicyDocument({ orgId, uploadedBy, filename, mimeType, buffer }) {
  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Accepted: PDF, Word (.docx), plain text, or markdown.`)
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (${Math.round(buffer.length / 1024 / 1024)}MB). Limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`)
  }

  const db = getSupabaseScoped(orgId)
  const storagePath = `${orgId}/${crypto.randomUUID()}-${filename}`

  const { error: uploadErr } = await db.storage
    .from('policy-documents')
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false })
  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  const { data: doc, error: insertErr } = await db
    .from('org_policy_documents')
    .insert({ org_id: orgId, uploaded_by: uploadedBy, filename, mime_type: mimeType, storage_path: storagePath, status: 'processing' })
    .select()
    .single()
  if (insertErr) throw new Error(insertErr.message)

  // Extract in the background of this request — we still await it (Next.js
  // API routes don't have a fire-and-forget primitive worth trusting), but
  // it's kept as a separate step so a parse failure downgrades the document
  // to status='error' with a message instead of losing the upload entirely.
  try {
    const text = await extractText(buffer, mimeType)
    if (!text || text.length < 20) {
      throw new Error('No readable text found in this document (it may be a scanned image with no text layer).')
    }
    const truncated = text.length > MAX_POLICY_CHARS_PER_DOC
      ? text.slice(0, MAX_POLICY_CHARS_PER_DOC) + '\n\n[...document truncated for length...]'
      : text
    const { data: updated, error: updateErr } = await db
      .from('org_policy_documents')
      .update({ extracted_text: truncated, status: 'processed' })
      .eq('id', doc.id)
      .select()
      .single()
    if (updateErr) throw new Error(updateErr.message)
    return updated
  } catch (err) {
    await db.from('org_policy_documents').update({ status: 'error', error_message: err.message }).eq('id', doc.id)
    throw err
  }
}

export async function listPolicyDocuments(orgId) {
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db
    .from('org_policy_documents')
    .select('id, filename, mime_type, status, error_message, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function deletePolicyDocument(orgId, docId) {
  const db = getSupabaseScoped(orgId)
  const { data: doc, error: fetchErr } = await db
    .from('org_policy_documents')
    .select('id, storage_path')
    .eq('id', docId)
    .eq('org_id', orgId)
    .single()
  if (fetchErr) throw new Error('Document not found.')

  await db.storage.from('policy-documents').remove([doc.storage_path])
  const { error: delErr } = await db.from('org_policy_documents').delete().eq('id', docId).eq('org_id', orgId)
  if (delErr) throw new Error(delErr.message)
}

// ─── Generation ──────────────────────────────────────────────────────────────

const VALID_TARGETS = ['scenarios', 'rubrics', 'financial', 'qbr']

async function callGenerationModel(system, userPrompt, maxTokens = 4000) {
  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  })
  const raw = response.content?.map(b => b.text || '').join('') || ''
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('AI generation returned content that could not be parsed as JSON. Try again, or reduce the number of source documents.')
  }
}

function buildPolicyContext(docs) {
  return docs.map(d => `=== SOURCE DOCUMENT: ${d.filename} ===\n${d.extracted_text}`).join('\n\n')
}

// Scenarios + rubrics are generated together (a scenario's success_criteria
// and rubric_weighting are meaningless without the scenario they score) and
// written as scenario_versions rows with org_id set + status='draft'.
async function generateScenarios({ db, orgId, userId, docs, industryId, serviceLine, trainingType }) {
  const base = INDUSTRY_CONFIG[industryId] || INDUSTRY_CONFIG['higher-ed']
  const policyContext = buildPolicyContext(docs)

  const system = `You are a senior instructional designer building role-play training scenarios for CommunicateIQ, a communication-skills training platform. You are given an organization's own policy/procedure documents. Every scenario you generate must be grounded in specifics from those documents — cite the actual policy (e.g. "per the Overtime Distribution Policy, Section 3") inside the scenario context, persona, or success criteria wherever it's natural to do so. Do not invent policy details that are not in the source material.

Generate exactly 2 scenarios as a JSON array. Each element must have this exact shape:
{
  "title": "short scenario title",
  "difficulty": "Foundational" | "Intermediate" | "Advanced",
  "context": "2-4 sentences setting up the situation, referencing specific policy content",
  "openingLine": "the counterpart's opening line of dialogue",
  "persona": "a detailed description of who the trainee is talking to: what they care about, how they behave, what makes them push back — written the way a screenwriter would brief an actor",
  "successCriteria": ["5-6 specific, checkable criteria a trainee's response should meet, at least 2 of which explicitly reference the organization's policy"],
  "rubricNotes": "1-2 sentences on what should distinguish a Proficient (3/4) response from a Distinguished (4/4) response for this specific scenario"
}

Output ONLY the JSON array, no preamble, no markdown fences.`

  const userPrompt = `ORGANIZATION'S POLICY DOCUMENTS:\n${policyContext}\n\nIndustry: ${base.label || industryId}\nTraining track: ${trainingType}\n\nGenerate 2 scenarios for this training track grounded in the policies above.`

  const scenarios = await callGenerationModel(system, userPrompt, 3000)
  if (!Array.isArray(scenarios)) throw new Error('Expected a JSON array of scenarios.')

  // Insert family + version per scenario in parallel — these are independent
  // rows, and Netlify's synchronous function timeout (10s default) makes
  // three sequential round trips on top of the generation call itself a real
  // risk of the request getting killed before it can respond.
  const inserted = await Promise.all(scenarios.map(async (s, idx) => {
    const { data: family, error: famErr } = await db
      .from('scenario_families')
      .insert({ org_id: orgId, slug: `org-${orgId.slice(0, 8)}-${Date.now()}-${idx}`, industry_id: industryId, training_type: trainingType })
      .select()
      .single()
    if (famErr) throw new Error(famErr.message)

    const { data: version, error: verErr } = await db
      .from('scenario_versions')
      .insert({
        family_id: family.id,
        version_number: 1,
        status: 'draft',
        title: s.title,
        day_label: 'Custom',
        difficulty: s.difficulty || 'Intermediate',
        role_persona: s.persona || '',
        context: s.context || '',
        opening_line: s.openingLine || '',
        client_persona: s.persona || '',
        success_criteria: s.successCriteria || [],
        rubric_weighting: { notes: s.rubricNotes || '' },
        authored_by: userId,
        source_document_id: docs[0]?.id || null,
      })
      .select()
      .single()
    if (verErr) throw new Error(verErr.message)

    // Deliberately NOT setting scenario_families.current_version_id here —
    // a DB trigger (trg_prevent_unapproved_current_version) rejects that for
    // anything but an approved version, and nothing in the app reads this
    // column to resolve live content anyway (see app/api/scenarios, which
    // resolves purely off scenario_versions.status = 'approved'). Approving
    // a draft is the only thing that should ever make it "current."
    return { familyId: family.id, versionId: version.id, title: s.title }
  }))
  return inserted
}

async function generateModuleConfig({ db, orgId, userId, docs, industryId, serviceLine, module }) {
  const base = INDUSTRY_CONFIG[industryId] || INDUSTRY_CONFIG['higher-ed']
  const serviceLineOverride = serviceLine && SERVICE_LINE_CONFIG[serviceLine] ? SERVICE_LINE_CONFIG[serviceLine](base) : base
  const policyContext = buildPolicyContext(docs)

  const shapeDesc = module === 'financial'
    ? `{
  "financialMetrics": [ { "id": "camelCaseId", "label": "Metric Label", "placeholder": "e.g. 91%", "internal": "what this metric means internally", "defaultValue": "", "defaultTranslation": "" } ],
  "financialChallenges": [ "a tough question the decision-maker might ask about a metric that is off-target" ]
}`
    : `{
  "qbrSections": [ { "id": "camelCaseId", "label": "Section Label", "desc": "one-sentence prompt for what goes in this section", "defaultValue": "" } ],
  "qbrPersonas": [ { "id": "camelCaseId", "label": "Persona Title", "icon": "single emoji", "style": "how this person behaves and what they push on in a QBR" } ]
}`

  const system = `You are a senior instructional designer for CommunicateIQ, a communication-skills training platform. You are given an organization's own policy/procedure documents and the platform's existing generic content for this module as a style reference. Generate a customized replacement that reflects this organization's actual metrics, terminology, and policies from the source documents — do not invent numbers or policies that are not implied by the source material; use placeholder/example values only where the existing reference content does.

Existing generic content for this module (style/shape reference only — do not copy its specific numbers):
${JSON.stringify(module === 'financial' ? { financialMetrics: serviceLineOverride.financialMetrics, financialChallenges: serviceLineOverride.financialChallenges } : { qbrSections: serviceLineOverride.qbrSections, qbrPersonas: serviceLineOverride.qbrPersonas }, null, 2)}

Output ONLY a single JSON object with this exact shape, no preamble, no markdown fences:
${shapeDesc}`

  const userPrompt = `ORGANIZATION'S POLICY DOCUMENTS:\n${policyContext}\n\nGenerate the customized ${module === 'financial' ? 'Financial Storytelling metrics/challenges' : 'QBR sections/personas'} for this organization.`

  const config = await callGenerationModel(system, userPrompt, 3500)

  const { data: row, error } = await db
    .from('org_module_config')
    .insert({
      org_id: orgId,
      industry_id: industryId,
      service_line: serviceLine || 'dining',
      module,
      config,
      status: 'draft',
      source_document_id: docs[0]?.id || null,
      authored_by: userId,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function generateContentFromPolicies({ orgId, userId, documentIds, industryId, serviceLine, trainingType, targets }) {
  if (!documentIds?.length) throw new Error('Select at least one policy document to generate from.')
  const invalidTargets = (targets || []).filter(t => !VALID_TARGETS.includes(t))
  if (invalidTargets.length) throw new Error(`Unknown target(s): ${invalidTargets.join(', ')}`)
  if (!targets?.length) throw new Error('Select at least one content type to generate.')

  const db = getSupabaseScoped(orgId)
  const { data: docs, error: docErr } = await db
    .from('org_policy_documents')
    .select('id, filename, extracted_text, status')
    .eq('org_id', orgId)
    .in('id', documentIds)
  if (docErr) throw new Error(docErr.message)
  const usable = (docs || []).filter(d => d.status === 'processed' && d.extracted_text)
  if (!usable.length) throw new Error('None of the selected documents have processed text yet.')

  const results = {}
  if (targets.includes('scenarios') || targets.includes('rubrics')) {
    results.scenarios = await generateScenarios({
      db, orgId, userId, docs: usable, industryId, serviceLine,
      trainingType: trainingType || (serviceLine || 'executive-communication'),
    })
  }
  if (targets.includes('financial')) {
    results.financial = await generateModuleConfig({ db, orgId, userId, docs: usable, industryId, serviceLine, module: 'financial' })
  }
  if (targets.includes('qbr')) {
    results.qbr = await generateModuleConfig({ db, orgId, userId, docs: usable, industryId, serviceLine, module: 'qbr' })
  }
  return results
}

// ─── Review / approval ───────────────────────────────────────────────────────
// Mirrors the review queue pattern in lib/reviews.js, but for content drafts
// rather than scored attempts.

export async function listDraftContent(orgId) {
  const db = getSupabaseScoped(orgId)

  const { data: scenarioRows, error: scErr } = await db
    .from('scenario_versions')
    .select('id, title, status, difficulty, day_label, created_at, source_document_id, scenario_families!inner(id, org_id, industry_id, training_type)')
    .eq('scenario_families.org_id', orgId)
    .in('status', ['draft', 'pending_review'])
    .order('created_at', { ascending: false })
  if (scErr) throw new Error(scErr.message)

  const { data: configRows, error: cfErr } = await db
    .from('org_module_config')
    .select('id, module, industry_id, service_line, status, created_at, source_document_id')
    .eq('org_id', orgId)
    .in('status', ['draft', 'pending_review'])
    .order('created_at', { ascending: false })
  if (cfErr) throw new Error(cfErr.message)

  return {
    scenarios: (scenarioRows || []).map(r => ({
      id: r.id, title: r.title, status: r.status, difficulty: r.difficulty,
      industryId: r.scenario_families.industry_id, trainingType: r.scenario_families.training_type,
      createdAt: r.created_at, sourceDocumentId: r.source_document_id,
    })),
    moduleConfig: (configRows || []).map(r => ({
      id: r.id, module: r.module, industryId: r.industry_id, serviceLine: r.service_line,
      status: r.status, createdAt: r.created_at, sourceDocumentId: r.source_document_id,
    })),
  }
}

export async function approveScenario(orgId, versionId, approverId) {
  const db = getSupabaseScoped(orgId)
  const { error } = await db
    .from('scenario_versions')
    .update({ status: 'approved', approved_by: approverId, approved_at: new Date().toISOString() })
    .eq('id', versionId)
  if (error) throw new Error(error.message)
}

export async function rejectScenario(orgId, versionId) {
  const db = getSupabaseScoped(orgId)
  const { error } = await db.from('scenario_versions').update({ status: 'archived' }).eq('id', versionId)
  if (error) throw new Error(error.message)
}

export async function approveModuleConfig(orgId, configId, approverId) {
  const db = getSupabaseScoped(orgId)
  // Archive any previously-approved config for this org/industry/service
  // line/module so exactly one approved row is ever live at a time.
  const { data: row, error: fetchErr } = await db.from('org_module_config').select('org_id, industry_id, service_line, module').eq('id', configId).single()
  if (fetchErr) throw new Error(fetchErr.message)
  await db.from('org_module_config')
    .update({ status: 'archived' })
    .eq('org_id', row.org_id).eq('industry_id', row.industry_id).eq('service_line', row.service_line).eq('module', row.module)
    .eq('status', 'approved')
  const { error } = await db
    .from('org_module_config')
    .update({ status: 'approved', approved_by: approverId, approved_at: new Date().toISOString() })
    .eq('id', configId)
  if (error) throw new Error(error.message)
}

export async function rejectModuleConfig(orgId, configId) {
  const db = getSupabaseScoped(orgId)
  const { error } = await db.from('org_module_config').update({ status: 'archived' }).eq('id', configId)
  if (error) throw new Error(error.message)
}

// ─── Public read: approved org module config ────────────────────────────────
// Used by /api/org-config, called from an authenticated trainee session the
// same way financial/QBR pages already read industry config. orgId comes
// from the caller's own session (see app/api/org-config/route.js) — never
// trust an orgId passed any other way here, same rule as lib/admin.js.
export async function getApprovedModuleConfig(orgId, industryId, serviceLine, module) {
  if (!orgId) return null
  const db = getSupabaseScoped(orgId)
  const { data, error } = await db
    .from('org_module_config')
    .select('config')
    .eq('org_id', orgId).eq('industry_id', industryId).eq('service_line', serviceLine || 'dining').eq('module', module).eq('status', 'approved')
    .order('approved_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.config || null
}
