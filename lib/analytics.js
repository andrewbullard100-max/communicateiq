// ─── Longitudinal competency analytics ──────────────────────────────────────
// Turns a flat list of attempts (each with a `scores` object and a
// `timestamp`) into an Initial → Current → Trend view per dimension —
// "Andrew improved from 58 → 74 → 86 across three attempts" instead of just
// the most recent score. Deliberately dimension-key-agnostic: it reads
// whatever keys are present in `scores` rather than assuming the five
// role-play dimensions, so it works for Simulation/Leadership
// (clarity/data/ownership/tone/commitment) and QBR (executivePresence/
// dataCommand/strategicFraming/questionHandling/decisionClarity) without
// either module needing to know about the other's rubric.

// A small window (rather than "first attempt" / "last attempt") smooths out
// one noisy score so a single bad day doesn't read as a reversal, or a
// single lucky one as mastery.
const TREND_WINDOW = 3
// Deltas smaller than this are "flat" — noise, not a real trend, given a
// 1-4 scale.
const FLAT_THRESHOLD = 0.15

function avg(nums) {
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// Known dimension labels across modules — falls back to humanizing the raw
// key (camelCase -> Title Case) for anything not listed here, so a future
// module's dimensions show up readably with zero wiring required.
export const DIMENSION_LABELS = {
  clarity: 'Clarity',
  data: 'Data Discipline',
  ownership: 'Ownership',
  tone: 'Executive Tone',
  commitment: 'Forward Commitment',
  executivePresence: 'Executive Presence',
  dataCommand: 'Data Command',
  strategicFraming: 'Strategic Framing',
  questionHandling: 'Question Handling',
  decisionClarity: 'Decision Clarity',
}

export function dimensionLabel(id) {
  if (DIMENSION_LABELS[id]) return DIMENSION_LABELS[id]
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim()
}

// attempts: array of { timestamp, scores: { [dimId]: 1-4 } }, any order.
// Returns { dimensions: { [dimId]: {...} }, overall: {...} | null }
export function computeCompetencyTrend(attempts) {
  const sorted = [...(attempts || [])]
    .filter(a => a.scores && typeof a.scores === 'object')
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

  // Collect a { t, v } series per dimension across every attempt that
  // scored it, regardless of which module produced the attempt.
  const seriesByDim = {}
  for (const a of sorted) {
    for (const [dim, v] of Object.entries(a.scores)) {
      if (typeof v !== 'number') continue
      ;(seriesByDim[dim] ||= []).push({ t: a.timestamp || 0, v })
    }
  }

  const dimensions = {}
  for (const [dim, series] of Object.entries(seriesByDim)) {
    const n = series.length
    const initial = avg(series.slice(0, Math.min(TREND_WINDOW, n)).map(p => p.v))
    const current = avg(series.slice(-Math.min(TREND_WINDOW, n)).map(p => p.v))
    const delta = n >= 2 ? +(current - initial).toFixed(2) : null
    const direction =
      delta === null ? 'insufficient' : delta > FLAT_THRESHOLD ? 'up' : delta < -FLAT_THRESHOLD ? 'down' : 'flat'
    dimensions[dim] = {
      label: dimensionLabel(dim),
      n,
      initial: +initial.toFixed(2),
      current: +current.toFixed(2),
      delta,
      direction, // 'up' | 'down' | 'flat' | 'insufficient' (fewer than 2 data points)
      history: series,
    }
  }

  const dimEntries = Object.values(dimensions)
  const overall = dimEntries.length
    ? {
        initial: +avg(dimEntries.map(d => d.initial)).toFixed(2),
        current: +avg(dimEntries.map(d => d.current)).toFixed(2),
      }
    : null
  if (overall) overall.delta = +(overall.current - overall.initial).toFixed(2)

  return { dimensions, overall }
}

// Convenience for a roster view: given { name, email, results } per user
// (results = attempts array), returns each user's strongest dimension,
// clearest development opportunity (lowest current score), and whether
// they're trending up/down/flat overall — the inputs to a "Strength /
// Development opportunity / Trend" line without hardcoding either rubric.
export function summarizeForCoaching(trend) {
  const dims = Object.entries(trend.dimensions)
  if (!dims.length) return null
  const strongest = dims.reduce((best, cur) => (cur[1].current > best[1].current ? cur : best))
  const weakest = dims.reduce((worst, cur) => (cur[1].current < worst[1].current ? cur : worst))
  return {
    strength: strongest[1].label,
    strengthScore: strongest[1].current,
    developmentOpportunity: weakest[1].label,
    developmentScore: weakest[1].current,
    overallDirection: trend.overall?.delta > FLAT_THRESHOLD ? 'up' : trend.overall?.delta < -FLAT_THRESHOLD ? 'down' : 'flat',
    overallDelta: trend.overall?.delta ?? null,
  }
}
