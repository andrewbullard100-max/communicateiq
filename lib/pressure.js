// ─── Adaptive scenario difficulty ───────────────────────────────────────────
// A 5-level behavioral pressure modifier, applied at system-prompt
// construction time on top of whatever scenario content is already
// selected — deliberately NOT a new content tier. scenario_versions.difficulty
// (Foundational/Advanced) is a content-authoring label set when a scenario is
// written; pressure level is a per-attempt runtime setting the learner (or
// the recommendation below) chooses, independent of which scenario they
// picked. This avoids reclassifying the ~90 existing scenarios into a new
// taxonomy while still delivering real difficulty progression: the AI
// character's behavior and the scoring strictness both change with level,
// not just a badge color.

export const PRESSURE_LEVELS = [
  {
    level: 1,
    label: 'Cooperative',
    shortLabel: 'L1 · Cooperative',
    description: 'The stakeholder asks reasonable questions and gives you room to explain.',
    directive: `PRESSURE LEVEL 1 — COOPERATIVE: Ask straightforward, reasonable questions. Give the trainee room to fully explain themselves before responding. Do not interrupt. Accept a well-structured answer without pushing further. This is a low-stakes practice rep, not a test.`,
  },
  {
    level: 2,
    label: 'Challenging',
    shortLabel: 'L2 · Challenging',
    description: 'Expect pushback and requests for information the trainee may not have ready.',
    directive: `PRESSURE LEVEL 2 — CHALLENGING: Push back at least once on a vague or unsupported claim. Ask for a specific number or detail the trainee may not have prepared. If they deflect, ask the follow-up again in a different way rather than letting it go.`,
  },
  {
    level: 3,
    label: 'Executive Pressure',
    shortLabel: 'L3 · Executive Pressure',
    description: 'Interruptions, ambiguity, and real skepticism — closer to an unprepared real conversation.',
    directive: `PRESSURE LEVEL 3 — EXECUTIVE PRESSURE: Interrupt at least once if the trainee is rambling or burying the headline. Express visible skepticism toward at least one claim ("How confident are you in that number?"). Introduce one piece of ambiguous or incomplete information they have to work with, not around. Do not make this easy to recover from with generic reassurance.`,
  },
  {
    level: 4,
    label: 'Crisis',
    shortLabel: 'L4 · Crisis',
    description: 'Reputation, contract, employee, or financial consequences are explicitly on the table.',
    directive: `PRESSURE LEVEL 4 — CRISIS: Treat this as a conversation with real consequences attached — contract renewal, a formal complaint, budget exposure, or an employee/safety issue, as fits the scenario. Name the stakes explicitly early in the conversation. Press hard on ownership: if the trainee explains what others did without stating what they personally are doing about it, call that out directly. Do not soften the tone to make this comfortable.`,
  },
  {
    level: 5,
    label: 'Executive Assessment',
    shortLabel: 'L5 · Executive Assessment',
    description: 'Minimal prompting, adaptive follow-ups, and harder scoring — the certification-grade bar.',
    directive: `PRESSURE LEVEL 5 — EXECUTIVE ASSESSMENT: Give minimal opening context and let the trainee drive. Ask adaptive follow-up questions based specifically on what they just said, not scripted ones. Treat this as a certification-grade bar: reserve a 4 (Distinguished) on any dimension for a response that would genuinely satisfy a skeptical senior executive, not merely a competent one. A response that would score Proficient at lower pressure levels may only be Developing here — score accordingly.`,
  },
]

export const PRESSURE_LEVEL_BY_NUMBER = Object.fromEntries(PRESSURE_LEVELS.map(p => [p.level, p]))

// Builds the weak-dimension targeting directive from a learner's competency
// trend (see lib/analytics.js). Deliberately only fires once there's enough
// history to trust the signal — targeting a "weak" dimension off one data
// point would just be noise dressed up as personalization.
export function buildAdaptiveDirective(trend) {
  if (!trend?.dimensions) return null
  const withEnoughData = Object.values(trend.dimensions).filter(d => d.n >= 2)
  if (!withEnoughData.length) return null

  const weakest = withEnoughData.reduce((worst, cur) => (cur.current < worst.current ? cur : worst))
  if (weakest.current >= 3) return null // nothing meaningfully weak — don't manufacture a gap

  return `ADAPTIVE FOCUS: This trainee's demonstrated weak spot across past attempts is ${weakest.label} (currently averaging ${weakest.current.toFixed(1)}/4). Without announcing it, steer at least one moment of this conversation to specifically require ${weakest.label.toLowerCase()} — e.g. if it's Data Discipline, ask for the actual number rather than accepting a general statement; if it's Ownership, ask directly what THEY are doing, not their team; if it's Forward Commitment, ask who specifically and by when. Score this dimension according to the normal rubric — the point is to give them a real rep at their actual gap, not to fail them.`
}

// Recommends a starting pressure level from attempt history — purely a
// default; the learner can always override it in the picker. New learners
// start gentle; a track record of strong, consistent scores raises the
// floor. This reads the same `overall.current` computed by
// computeCompetencyTrend, so it moves in lockstep with what the trainee
// sees on their own Executive Communication Profile.
export function recommendPressureLevel(trend, attemptCount) {
  if (!attemptCount || attemptCount < 2) {
    return { level: 1, rationale: 'New to this module — starting at the cooperative level.' }
  }
  const overall = trend?.overall?.current
  if (overall == null) {
    return { level: 2, rationale: 'A little experience, not enough scored data yet to calibrate further.' }
  }
  if (attemptCount >= 6 && overall >= 3.5) {
    return { level: 5, rationale: `Consistently scoring Distinguished (${overall.toFixed(1)}/4 avg) across ${attemptCount} attempts — ready for certification-grade pressure.` }
  }
  if (attemptCount >= 5 && overall >= 3.0) {
    return { level: 4, rationale: `Strong track record (${overall.toFixed(1)}/4 avg over ${attemptCount} attempts) — ready for real stakes.` }
  }
  if (attemptCount >= 3 && overall >= 2.5) {
    return { level: 3, rationale: `Solid recent performance (${overall.toFixed(1)}/4 avg) — ready for real pushback.` }
  }
  if (overall < 2) {
    return { level: 1, rationale: `Recent scores (${overall.toFixed(1)}/4 avg) suggest more cooperative reps before adding pressure.` }
  }
  return { level: 2, rationale: `Building a track record (${overall.toFixed(1)}/4 avg over ${attemptCount} attempts).` }
}
