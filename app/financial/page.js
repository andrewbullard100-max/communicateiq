'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { C, callAI, getSelectedIndustryId, getIndustryConfig } from '../../lib/data'

export default function FinancialPage() {
  const [industryId, setIndustryId] = useState('higher-ed')
  useEffect(() => { setIndustryId(getSelectedIndustryId()) }, [])
  const cfg = getIndustryConfig(industryId)
  const METRICS = cfg.financialMetrics
  const CFO_CHALLENGES = cfg.financialChallenges

  const [metrics, setMetrics] = useState(() => Object.fromEntries(METRICS.map(m => [m.id, m.defaultValue || ''])))
  const [translations, setTranslations] = useState(() => Object.fromEntries(METRICS.map(m => [m.id, m.defaultTranslation || ''])))
  const [challenge, setChallenge] = useState(CFO_CHALLENGES[0])
  // Re-seed metric/translation defaults and the active challenge once the
  // real industry resolves post-mount (initial render uses higher-ed).
  useEffect(() => {
    setMetrics(Object.fromEntries(METRICS.map(m => [m.id, m.defaultValue || ''])))
    setTranslations(Object.fromEntries(METRICS.map(m => [m.id, m.defaultTranslation || ''])))
    setChallenge(CFO_CHALLENGES[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryId])
  const [challengeResponse, setChallengeResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [coachingTab, setCoachingTab] = useState(null)
  const [translationFeedback, setTranslationFeedback] = useState('')
  const [challengeFeedback, setChallengeFeedback] = useState('')
  const [account, setAccount] = useState('')

  function updateMetric(id, val) { setMetrics(m => ({ ...m, [id]: val })) }
  function updateTranslation(id, val) { setTranslations(t => ({ ...t, [id]: val })) }

  const hasMetrics = METRICS.some(m => metrics[m.id]?.trim())
  const hasTranslations = METRICS.some(m => translations[m.id]?.trim())

  async function getTranslationFeedback() {
    setLoading(true)
    setCoachingTab('translations')
    const list = METRICS.filter(m => metrics[m.id] && translations[m.id]).map(m =>
      `METRIC: ${m.label} = ${metrics[m.id]}\nINTERNAL MEANING: ${m.internal}\nGM'S CLIENT TRANSLATION: "${translations[m.id]}"`
    ).join('\n\n')

    const system = `You are a master facilitator coaching a foodservice GM on financial storytelling for a client ${cfg.decisionMakerTitle}.

CRITICAL TERMINOLOGY RULES — flag violations in your feedback:
- "Percentage points" (or "points") = the arithmetic difference between two percentages. Example: food cost moving from 34% to 38% is up 4 percentage points (NOT "4 percent").
- "Percent" = a relative change. Example: revenue growing from $800K to $848K is up 6 percent.
- "Basis points" = used in finance/investment contexts. 100 basis points = 1 percentage point. Do NOT use basis points in dining operations — say "percentage points" or "points" instead.
- NEVER say "food cost is up 4%" when you mean "food cost is up 4 percentage points." These mean completely different things to a CFO.
- Meal plan participation changes should be stated in "percentage points" not "percent."
- Revenue changes should be stated as "percent" (relative change).

Review each metric translation and give specific, direct feedback. Rate each as Weak/Developing/Proficient/Distinguished.
Flag any terminology errors prominently.
Format with metric name as header, then brief feedback. End with one overall coaching note.
Total response under 400 words. Be specific to what they wrote, not generic.`

    try {
      const result = await callAI({
        system,
        messages: [{ role: 'user', content: `Account: ${account || 'Not specified'}\n\nTranslations to review:\n\n${list || 'No translations submitted yet.'}` }],
        max_tokens: 600,
      })
      setTranslationFeedback(result)
    } catch { setTranslationFeedback('Connection error. Please try again.') }
    setLoading(false)
  }

  async function getChallengeFeedback() {
    if (!challengeResponse.trim()) return
    setLoading(true)
    setCoachingTab('challenge')
    const system = `You are a master facilitator for CommunicateIQ's Executive Communication Training Program.
A GM just responded to a CFO challenge. Evaluate their response using the five-dimension rubric:
Clarity, Data Discipline, Ownership, Executive Tone, Forward Commitment (each 1-4).

TERMINOLOGY — flag any violations:
- "Points" or "percentage points" = difference between two percentages (food cost, labor %, participation rates)
- "Percent" = relative change (revenue growth, cost increases)
- Never use "basis points" in a dining operations context
- Never say "up X%" when describing a change in a percentage metric — say "up X points" or "up X percentage points"

Format exactly:
## Score: X/20
## Dimension Breakdown
[list each dimension with score and one-line reason]
## Strongest Element
[one sentence]
## Critical Gap
[one sentence]
## Distinguished Version
[write what a 4/4 Distinguished response would have said — 2-3 sentences max]
Keep total under 300 words.`

    try {
      const result = await callAI({
        system,
        messages: [{ role: 'user', content: `CFO CHALLENGE: "${challenge}"\n\nGM RESPONSE: "${challengeResponse}"\n\nAccount data context:\n${METRICS.filter(m => metrics[m.id]).map(m => `${m.label}: ${metrics[m.id]}`).join(', ')}` }],
        max_tokens: 500,
      })
      setChallengeFeedback(result)
    } catch { setChallengeFeedback('Connection error. Please try again.') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>Day 2 · Financial Storytelling</span>
        </div>

        <span className="label">Day 2 · Financial Storytelling & Contract Intelligence</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 8 }}>Translate Your P&L Into Client Language</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          The {cfg.decisionMakerTitle} doesn't speak "board days" or "managed forecast." Every number you show them must land in terms they care about. Enter your real numbers, write your translations, and get AI coaching on how a {cfg.decisionMakerTitle} would actually hear them.
        </p>

        {/* Terminology Guidance Card */}
        <div className="card fade-up-1" style={{ marginBottom: 16, borderLeft: '4px solid #1C2B5E', background: '#FFFFFF' }}>
          <span className="label" style={{ color: '#1C2B5E' }}>Terminology Reference — Know Before You Present</span>
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 14, lineHeight: 1.7 }}>
            Using the wrong term signals to a CFO that you don't understand your own numbers. Here's the rule:
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              {
                term: 'Percentage Points (or "Points")',
                rule: 'Use when describing the arithmetic difference between two percentages.',
                right: 'Food cost moved from 34.2% to 38.6% — up 4.4 percentage points.',
                wrong: '"Food cost is up 4.4 percent." (This implies a relative increase of 4.4%, which would mean a much smaller move.)',
                applies: 'Food cost %, labor %, participation/utilization rate, satisfaction scores',
              },
              {
                term: 'Percent (%)',
                rule: 'Use when describing a relative change — comparing one value to another.',
                right: 'Retail revenue grew 12.2%. Labor costs increased 6.8% year-over-year.',
                wrong: '"Retail revenue is up 12.2 points." (Points implies a difference between two percentages.)',
                applies: 'Revenue changes, wage increases, year-over-year cost changes',
              },
              {
                term: 'Basis Points',
                rule: 'A finance term. 100 basis points = 1 percentage point. Do NOT use in dining operations.',
                right: 'Say "up 1.6 percentage points" — not "up 160 basis points."',
                wrong: 'Using basis points in a client QBR — it sounds like you\'re trying to impress, not communicate.',
                applies: 'Avoid entirely in client conversations',
              },
            ].map((item, i) => (
              <div key={i} style={{ background: '#F4F6F9', borderRadius: 8, padding: '12px 14px', border: '1px solid #D1D5DB' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1C2B5E', marginBottom: 4 }}>{item.term}</div>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>{item.rule}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(27,107,47,0.08)', border: '1px solid #2A8A40', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#2A8A40', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>✓ SAY THIS</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{item.right}</div>
                  </div>
                  <div style={{ background: 'rgba(192,0,0,0.06)', border: '1px solid #C00000', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#C00000', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>✗ NOT THIS</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{item.wrong}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>Applies to: {item.applies}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="card fade-up-2" style={{ marginBottom: 16 }}>
          <span className="label">{cfg.accountLabel}</span>
          <input value={account} onChange={e => setAccount(e.target.value)} placeholder={cfg.accountPlaceholder}
            style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '10px 14px', color: '#1C2B5E', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
        </div>

        {/* Exercise 2A */}
        <div className="card fade-up-3" style={{ marginBottom: 16 }}>
          <span className="label">Exercise 2A — Translate Your P&L</span>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Enter your actual metrics on the left. Write what you would say to the CFO — in their language — on the right. Watch your terminology.</p>

          <div style={{ display: 'grid', gap: 2, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 10, padding: '6px 0' }}>
              <div style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>METRIC</div>
              <div style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>YOUR ACTUAL VALUE</div>
              <div style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>WHAT YOU'D SAY TO THE {cfg.decisionMakerTitle.toUpperCase()}</div>
            </div>
            {METRICS.map(m => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${C.navyLt}` }}>
                <div>
                  <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{m.internal}</div>
                </div>
                <input value={metrics[m.id] || ''} onChange={e => updateMetric(m.id, e.target.value)} placeholder={m.placeholder}
                  style={{ background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '8px 10px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
                <input value={translations[m.id] || ''} onChange={e => updateTranslation(m.id, e.target.value)} placeholder="Client-language explanation..."
                  style={{ background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '8px 10px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={getTranslationFeedback} disabled={!hasMetrics || !hasTranslations || loading}>
            Get AI Coaching on My Translations →
          </button>

          {coachingTab === 'translations' && (
            <div style={{ marginTop: 20, background: '#F4F6F9', borderRadius: 8, padding: 16, borderLeft: '3px solid #1C2B5E' }}>
              <span className="label">AI Translation Coach</span>
              {loading ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0,1,2].map(n => <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />)}
                  <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 8 }}>Reviewing your translations...</span>
                </div>
              ) : (
                <div style={{ color: '#374151', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{translationFeedback}</div>
              )}
            </div>
          )}
        </div>

        {/* Exercise 2B */}
        <div className="card fade-up-4" style={{ marginBottom: 24 }}>
          <span className="label">Exercise 2B — Mock {cfg.decisionMakerTitle} Challenge</span>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Select a challenge the {cfg.decisionMakerTitle} might raise. Write your response using the six-part framework. Get AI scoring.</p>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 8, fontWeight: 600 }}>Select {cfg.decisionMakerTitle} Challenge</div>
            {CFO_CHALLENGES.map((ch, i) => (
              <div key={i} onClick={() => setChallenge(ch)} style={{
                padding: '10px 14px', borderRadius: 6, border: `1px solid ${challenge === ch ? C.gold : C.navyLt}`,
                background: challenge === ch ? 'rgba(28,43,94,0.06)' : 'transparent',
                cursor: 'pointer', marginBottom: 6, fontSize: 13, color: challenge === ch ? C.white : C.gray,
                fontStyle: 'italic', transition: 'all 0.15s',
              }}>"{ch}"</div>
            ))}
          </div>

          <div style={{ background: 'rgba(28,43,94,0.06)', border: '1.5px solid #1C2B5E', borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>ACTIVE CHALLENGE</div>
            <div style={{ fontSize: 14, fontStyle: 'italic', color: '#1C2B5E' }}>"{challenge}"</div>
          </div>

          <textarea value={challengeResponse} onChange={e => setChallengeResponse(e.target.value)} rows={5}
            placeholder="Write your response to the CFO. Use the six-part framework: What / Why / Impact / Action / Support Needed / Follow-up..."
            style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '12px 14px', color: '#1C2B5E', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6, marginBottom: 14 }}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />

          <button className="btn-primary" onClick={getChallengeFeedback} disabled={!challengeResponse.trim() || loading}>
            Score My Response →
          </button>

          {coachingTab === 'challenge' && (
            <div style={{ marginTop: 20, background: '#F4F6F9', borderRadius: 8, padding: 16, borderLeft: '3px solid #1C2B5E' }}>
              <span className="label">AI Rubric Scoring</span>
              {loading ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0,1,2].map(n => <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />)}
                  <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 8 }}>Scoring your response...</span>
                </div>
              ) : (
                <div style={{ color: '#374151', fontSize: 13, lineHeight: 1.8 }}>
                  {challengeFeedback.split('\n').map((line, i) => (
                    <div key={i} style={{
                      fontWeight: line.startsWith('##') ? 700 : 400,
                      color: line.startsWith('##') ? C.gold : C.offWhite,
                      marginBottom: line.startsWith('##') ? 6 : 2,
                      fontSize: line.startsWith('##') ? 11 : 13,
                      letterSpacing: line.startsWith('##') ? 1 : 0,
                      textTransform: line.startsWith('##') ? 'uppercase' : 'none',
                      marginTop: line.startsWith('##') ? 12 : 0,
                    }}>{line.replace(/^##\s*/, '')}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/simulation" className="btn-ghost">← Back to Simulations</Link>
          <Link href="/qbr" className="btn-primary">Continue: QBR Builder →</Link>
        </div>
      </div>
    </div>
  )
}
