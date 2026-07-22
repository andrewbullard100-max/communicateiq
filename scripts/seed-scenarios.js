#!/usr/bin/env node
// ============================================================================
// scripts/seed-scenarios.js
//
// Reads the live SCENARIOS array out of lib/data.js (not a hand-copied
// duplicate — this loads the actual module so the seed always matches
// current content) and generates a SQL migration that seeds
// scenario_families + scenario_versions per the schema in
// communicateiq-schema.sql (org hierarchy / assignments / scenario
// authoring).
//
// Usage:
//   node scripts/seed-scenarios.js > scripts/output/seed-scenarios.sql
//   node scripts/seed-scenarios.js --stdout       (same, explicit)
//
// The generated SQL is idempotent: re-running it will not create duplicate
// scenario_families (looked up by slug) or duplicate scenario_versions
// (skipped if the family already has one). It is NOT a general-purpose
// "sync content changes" tool — if you edit a scenario in lib/data.js after
// the initial seed, this script will NOT create a new version for it. That
// path belongs to the (not-yet-built) authoring UI, which should create a
// new scenario_versions row and route it through draft -> pending_review ->
// approved, not silently overwrite the current approved version. This
// script exists purely to get the initial SCENARIOS array out of code and
// into the database once.
// ============================================================================

const fs = require('fs')
const path = require('path')
const Module = require('module')

// ─── 1. Load the real SCENARIOS array out of lib/data.js ───────────────────
// lib/data.js uses ESM `export const` syntax (fine inside Next's bundler,
// not fine for a plain `require()`). Rather than hand-maintain a second
// copy of the scenario data in this script — which would drift the moment
// someone edits a scenario — we strip the `export` keywords and load the
// resulting source as a normal CommonJS module. This guarantees the seed
// always reflects whatever is actually in lib/data.js right now.

function loadDataModule() {
  const dataPath = path.join(__dirname, '..', 'lib', 'data.js')
  let src = fs.readFileSync(dataPath, 'utf8')

  src = src.replace(/^export const /gm, 'const ')
  src = src.replace(/^export async function/gm, 'async function')
  src = src.replace(/^export function/gm, 'function')
  src += '\nmodule.exports = { SCENARIOS, INDUSTRY_CONFIG }'

  const m = new Module(dataPath, module)
  m.filename = dataPath
  m.paths = Module._nodeModulePaths(path.dirname(dataPath))
  m._compile(src, dataPath)
  return m.exports
}

const { SCENARIOS } = loadDataModule()

if (!Array.isArray(SCENARIOS) || SCENARIOS.length === 0) {
  console.error('No SCENARIOS found in lib/data.js — nothing to seed.')
  process.exit(1)
}

// ─── 2. Fixed system identity for library-authored content ─────────────────
// scenario_versions.authored_by / approved_by are NOT NULL FKs to users(id),
// and a fresh schema has no users yet. These scenarios are platform-wide
// library content (scenario_families.org_id IS NULL), not owned by any one
// customer, so they need a system author of record. Fixed UUIDs keep this
// script idempotent without a lookup step.
//
// NOTE: organizations.industry is a single NOT NULL value, but this system
// org exists only to anchor an authoring account and is never used for
// login or reporting — the industry value assigned to it is arbitrary.
const SYSTEM_ORG_ID  = '00000000-0000-0000-0000-000000000001'
const SYSTEM_UNIT_ID = '00000000-0000-0000-0000-000000000002'
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000003'

// ─── 3. Helpers ──────────────────────────────────────────────────────────────

// Postgres dollar-quoting sidesteps escaping every apostrophe/quote in
// scenario prose (which is full of both). Pick a tag unlikely to collide
// with content; verify per-string and fall back if it ever does.
function dollarQuote(str) {
  if (str === null || str === undefined) return 'NULL'
  let tag = 'CIQ'
  let n = 0
  while (str.includes(`$${tag}$`)) { n += 1; tag = `CIQ${n}` }
  return `$${tag}$${str}$${tag}$`
}

function jsonbLiteral(value) {
  if (value === null || value === undefined) return 'NULL'
  return `${dollarQuote(JSON.stringify(value))}::jsonb`
}

// Derive a short "who the AI plays" label from the persona text. Every
// existing persona in lib/data.js opens with a role description followed
// by an em-dash separator (e.g. "CFO at a university campus — politically
// exposed..."), so split on that; fall back to a truncated first sentence
// for anything that doesn't match the pattern.
function derivePersonaRole(clientPersona) {
  const emdash = clientPersona.indexOf('\u2014') // —
  if (emdash > 0 && emdash < 120) return clientPersona.slice(0, emdash).trim()
  const firstSentence = clientPersona.split(/[.\n]/)[0].trim()
  return firstSentence.length <= 120 ? firstSentence : firstSentence.slice(0, 117) + '...'
}

const EVEN_RUBRIC_WEIGHTING = { clarity: 1, data: 1, ownership: 1, tone: 1, commitment: 1 }

// ─── 4. Build the SQL ────────────────────────────────────────────────────────

const parts = []

parts.push(`-- ============================================================================
-- Seed: scenario_families / scenario_versions from lib/data.js SCENARIOS
-- Generated by scripts/seed-scenarios.js — do not hand-edit; re-run the
-- script and re-apply instead.
-- ${new Date().toISOString()}
-- ============================================================================

-- ─── System library-author identity ─────────────────────────────────────────
-- Idempotent: safe to re-run.
INSERT INTO organizations (id, name, industry, transcript_retention)
VALUES ('${SYSTEM_ORG_ID}', 'CommunicateIQ Content Library', 'higher-ed', 'none')
ON CONFLICT (id) DO NOTHING;

INSERT INTO org_units (id, org_id, parent_id, unit_type, name)
VALUES ('${SYSTEM_UNIT_ID}', '${SYSTEM_ORG_ID}', NULL, 'corporate', 'Content Library Root')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, org_id, org_unit_id, email, name, status)
VALUES ('${SYSTEM_USER_ID}', '${SYSTEM_ORG_ID}', '${SYSTEM_UNIT_ID}', 'library@communicateiq.internal', 'Content Library System Account', 'active')
ON CONFLICT (org_id, email) DO NOTHING;
`)

for (const s of SCENARIOS) {
  const slug = s.id.toLowerCase()
  const rolePersona = derivePersonaRole(s.clientPersona)
  const changeNotes = 'Seeded from lib/data.js SCENARIOS array (initial migration)'

  parts.push(`-- ─── ${s.id} · ${s.title} ───
DO $$
DECLARE
  fam_id UUID;
  ver_id UUID;
BEGIN
  SELECT id INTO fam_id FROM scenario_families WHERE org_id IS NULL AND slug = ${dollarQuote(slug)};

  IF fam_id IS NULL THEN
    INSERT INTO scenario_families (org_id, slug, industry_id, training_type)
    VALUES (NULL, ${dollarQuote(slug)}, ${dollarQuote(s.industry)}, ${dollarQuote(s.trainingType)})
    RETURNING id INTO fam_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM scenario_versions WHERE family_id = fam_id) THEN
    INSERT INTO scenario_versions (
      family_id, version_number, status, title, day_label, difficulty, role_persona,
      context, opening_line, client_persona, data_packet, success_criteria, rubric_weighting,
      authored_by, approved_by, approved_at, change_notes
    ) VALUES (
      fam_id, 1, 'approved',
      ${dollarQuote(s.title)},
      ${dollarQuote(s.day)},
      ${dollarQuote(s.difficulty)},
      ${dollarQuote(rolePersona)},
      ${dollarQuote(s.context)},
      ${dollarQuote(s.openingLine)},
      ${dollarQuote(s.clientPersona)},
      ${jsonbLiteral(s.dataPacket)},
      ${jsonbLiteral(s.successCriteria)},
      ${jsonbLiteral(EVEN_RUBRIC_WEIGHTING)},
      '${SYSTEM_USER_ID}', '${SYSTEM_USER_ID}', now(),
      ${dollarQuote(changeNotes)}
    )
    RETURNING id INTO ver_id;

    UPDATE scenario_families SET current_version_id = ver_id WHERE id = fam_id;
  END IF;
END $$;
`)
}

const sql = parts.join('\n')

// ─── 5. Output ───────────────────────────────────────────────────────────────
// Default: write to scripts/output/seed-scenarios.sql (and print a summary
// to stderr so stdout stays pure SQL if someone pipes it). --stdout forces
// printing the SQL to stdout instead.

const forceStdout = process.argv.includes('--stdout')
if (forceStdout) {
  process.stdout.write(sql)
} else {
  const outDir = path.join(__dirname, 'output')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'seed-scenarios.sql')
  fs.writeFileSync(outPath, sql)
  console.error(`Wrote ${SCENARIOS.length} scenarios to ${outPath}`)
  console.error('Apply with your migration tool of choice, e.g.:')
  console.error('  psql "$DATABASE_URL" -f scripts/output/seed-scenarios.sql')
}
