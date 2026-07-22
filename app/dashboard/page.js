'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { C, MODULES, callAI } from '../../lib/data'

const FIELD_TASKS = [
  { id: 'clientUpdate',    label: 'Client Executive Update',     desc: 'Deliver a structured executive update using the six-part framework to a senior client stakeholder', module: 'simulation' },
  { id: 'complaintCycle',  label: 'Service Recovery Cycle',      desc: 'Handle a complaint or service failure using the service recovery framework — proactively, not reactively', module: 'simulation' },
  { id: 'valuePitch',      label: 'Value Creation Pitch',        desc: 'Present a new initiative or improvement to a client using the options framework', module: 'financial' },
  { id: 'qbrDelivery',     label: 'Live QBR Delivery',           desc: 'Deliver a full QBR to your district manager or a live client executive audience', module: 'qbr' },
  { id: 'stakeholderMap',  label: 'Stakeholder Map Updated',     desc: 'Update your stakeholder map with at least two new discoveries about informal influencers', module: 'stakeholder' },
]

const CERT_SCENARIOS = [
  { id: 'written', label: 'Written Scenario Response', desc: 'Respond in writing to a complex multi-stakeholder situation using all frameworks', weight: '40%' },
  { id: 'verbal',  label: 'Simulated Verbal Exchange', desc: 'Complete a full AI-simulated executive conversation without preparation time', weight: '40%' },
  { id: 'map',     label: 'Stakeholder Map Submission', desc: 'Submit final account map with all required elements verified by AI', weight: '20%' },
]

const WRITTEN_SCENARIO = `You are 8 weeks post-bootcamp. Your CFO just received a complaint from three faculty members about the catering quality at last week's distinguished lecture dinner. Simultaneously, your spring satisfaction survey shows a 9-point decline in staff friendliness. The CFO has called a meeting for tomorrow morning. Write your preparation: (1) your opening statement for the meeting, (2) your action plan for each issue, and (3) the one decision you need from the CFO by end of meeting.`

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview') // overview | field | assessment | dm
  const [checklist, setChecklist] = useState({})
  const [certSection, setCertSection] = useState('written') // written | verbal
  const [writtenResponse, setWrittenResponse] = useState('')
  const [writtenFeedback, setWrittenFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [dmNotes, setDmNotes] = useState('')
  const [dmObservations, setDmObservations] = useState('')
  const [myResults, setMyResults] = useState([])

  useEffect(() => {
    fetch('/api/results?scope=self')
      .then(res => res.json())
      .then(data => setMyResults((data.results || []).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))))
      .catch(() => {})
  }, [])

  const completedTasks = FIELD_TASKS.filter(t => checklist[t.id]).length
  const daysSince = 0 // Would be calculated from actual training date in production
  const certProgress = Math.round((completedTasks / FIELD_TASKS.length) * 100)

  function toggleTask(id) { setChecklist(c => ({ ...c, [id]: !c[id] })) }

  async function scoreWrittenResponse() {
    if (!writtenResponse.trim()) return
    setLoading(true)
    const system = `You are an AI certification assessor for CommunicateIQ's Executive Communication Training Program conducting the Day 45 field assessment.
This is the official written scenario component of the full certification assessment.
Score using the five-dimension rubric: Clarity, Data Discipline, Ownership, Executive Tone, Forward Commitment (each 1-4).
Also assess: Multi-stakeholder navigation, Framework integration, Decision clarity.
Output format:
## CERTIFICATION ASSESSMENT — Written Scenario
## Dimension Scores
[each dimension: score and one specific reason]
## Aggregate Score: X/20
## Framework Integration: [Proficient/Developing/Weak]
## Decision Clarity: [Clear/Unclear]
## Certification Recommendation: [Proceed to Full Certification | Field Coaching Required | Reassessment Needed]
## Specific Development Note
Keep under 400 words. Be direct and specific.`

    try {
      const result = await callAI({ system, messages: [{ role: 'user', content: `SCENARIO: ${WRITTEN_SCENARIO}\n\nPARTICIPANT RESPONSE:\n${writtenResponse}` }], max_tokens: 700 })
      setWrittenFeedback(result)
    } catch { setWrittenFeedback('Connection error. Please try again.') }
    setLoading(false)
  }

  const tabStyle = (id) => ({
    padding: '9px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: activeTab === id ? C.gold : 'transparent',
    color: activeTab === id ? C.navy : C.gray,
    fontWeight: activeTab === id ? 700 : 400, fontSize: 13, fontFamily: 'inherit',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>45-Day Certification Dashboard</span>
        </div>

        <span className="label">45-Day Certification Window</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 20 }}>Certification Dashboard</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#F4F6F9', borderRadius: 8, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
          {[['overview','📊 Overview'],['field','✅ Field Tasks'],['assessment','🎓 Cert Assessment'],['dm','👔 DM Validation']].map(([id, label]) => (
            <button key={id} style={tabStyle(id)} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* Status banner */}
            <div className="card fade-up" style={{ marginBottom: 16, border: '1.5px solid #1C2B5E', background: `linear-gradient(135deg, ${C.navyMid}, ${C.navyLt})` }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>CERTIFICATION STATUS</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {completedTasks >= 5 ? '🟢 Ready for Assessment' : completedTasks >= 3 ? '🟡 Field Tasks In Progress' : '🔵 Boot Camp Complete — Field Phase Active'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: '#1C2B5E' }}>Day {daysSince || 1}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>of 45-day window</div>
                </div>
              </div>
            </div>

            {/* Recent simulation results */}
            {myResults.length > 0 && (
              <div className="card fade-up-2" style={{ marginBottom: 16 }}>
                <span className="label">My Recent Simulation Results</span>
                <div style={{ display: 'grid', gap: 8 }}>
                  {myResults.slice(0, 5).map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: '#F4F6F9', border: '1.5px solid #D1D5DB' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1C2B5E' }}>{r.scenarioTitle || r.scenarioId}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''} · {r.certificationStatus}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.scores && Object.values(r.scores).map((v, j) => (
                          <div key={j} style={{ width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: '#FFFFFF', background: v < 2 ? '#C00000' : v < 3 ? '#b87333' : C.green }}>{v}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                ['Field Tasks', `${completedTasks}/${FIELD_TASKS.length}`, completedTasks >= FIELD_TASKS.length ? C.green : '#b87333'],
                ['Cert Scenarios', '3', C.navyLt],
                ['DM Validation', 'Pending', C.navyLt],
                ['Target Score', '80%+', C.gold],
              ].map(([label, val, color]) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'monospace', marginBottom: 4 }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="card fade-up-2" style={{ marginBottom: 16 }}>
              <span className="label">Field Application Progress</span>
              <div style={{ background: '#F4F6F9', borderRadius: 6, height: 10, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${certProgress}%`, background: `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`, borderRadius: 6, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{certProgress}% field tasks complete — {FIELD_TASKS.length - completedTasks} remaining before certification assessment</div>
            </div>

            {/* Module status */}
            <div className="card fade-up-3">
              <span className="label">Training Module Status</span>
              <div style={{ display: 'grid', gap: 8 }}>
                {MODULES.filter(m => m.id !== 'dashboard').map(m => (
                  <Link key={m.id} href={m.href} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#F4F6F9', border: '1.5px solid #D1D5DB', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                      onMouseLeave={e => e.currentTarget.style.borderColor = C.navyLt}>
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1C2B5E' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{m.day}</div>
                      </div>
                      <span style={{ fontSize: 12, color: '#1C2B5E' }}>Open →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FIELD TASKS TAB */}
        {activeTab === 'field' && (
          <div>
            <div className="card fade-up" style={{ marginBottom: 16, background: 'rgba(28,43,94,0.04)', borderColor: '#1C2B5E' }}>
              <span className="label">30-Day Field Commitment</span>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
                These tasks must be completed in your real account during the 45-day window. Submit your completion checklist to your District Manager. The AI certification assessment opens once all tasks are checked.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {FIELD_TASKS.map((t, i) => (
                <div key={t.id} className={`card fade-up-${i+1}`} style={{ borderColor: checklist[t.id] ? C.green : C.navyLt, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <button onClick={() => toggleTask(t.id)} style={{
                      width: 28, height: 28, borderRadius: 6, border: `2px solid ${checklist[t.id] ? C.green : C.navyLt}`,
                      background: checklist[t.id] ? `${C.green}33` : 'transparent',
                      cursor: 'pointer', flexShrink: 0, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: checklist[t.id] ? C.greenLt : 'transparent', transition: 'all 0.2s',
                    }}>✓</button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: checklist[t.id] ? C.greenLt : C.white }}>{t.label}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{t.desc}</div>
                    </div>
                    <Link href={MODULES.find(m => m.id === t.module)?.href || '/'} style={{ fontSize: 11, color: '#1C2B5E', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                      Practice →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: '14px 18px', background: `rgba(55,86,35,0.15)`, border: `1px solid ${C.green}`, borderRadius: 8, fontSize: 13, color: '#374151' }}>
              <strong style={{ color: C.greenLt }}>{completedTasks}/{FIELD_TASKS.length} tasks complete.</strong>
              {completedTasks >= FIELD_TASKS.length ? ' You are ready for the certification assessment.' : ` Complete all ${FIELD_TASKS.length} tasks before scheduling your Day 45 assessment.`}
            </div>
          </div>
        )}

        {/* ASSESSMENT TAB */}
        {activeTab === 'assessment' && (
          <div>
            <div className="card fade-up" style={{ marginBottom: 16 }}>
              <span className="label">Day 45 — AI Certification Assessment</span>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 14 }}>
                The certification assessment has three components, each scored separately. You must achieve 80%+ overall with no critical failure dimensions. Complete in a single session without preparation time.
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {CERT_SCENARIOS.map(s => (
                  <div key={s.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#F4F6F9', borderRadius: 8, border: '1.5px solid #D1D5DB' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{s.desc}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#1C2B5E', fontWeight: 700 }}>{s.weight}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[['written','📝 Written Scenario'],['verbal','🎭 Verbal Simulation']].map(([id, label]) => (
                <button key={id} onClick={() => setCertSection(id)} style={{
                  padding: '8px 16px', borderRadius: 6, border: `1px solid ${certSection === id ? C.gold : C.navyLt}`,
                  background: certSection === id ? 'rgba(28,43,94,0.08)' : 'transparent',
                  color: certSection === id ? C.gold : C.gray, fontWeight: certSection === id ? 700 : 400,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>{label}</button>
              ))}
            </div>

            {certSection === 'written' && (
              <div className="card fade-up">
                <span className="label">Written Scenario — Day 45 Assessment</span>
                <div style={{ background: 'rgba(28,43,94,0.06)', border: `1px solid ${C.goldDim}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>SCENARIO</div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{WRITTEN_SCENARIO}</div>
                </div>
                <textarea value={writtenResponse} onChange={e => setWrittenResponse(e.target.value)} rows={8}
                  placeholder="Write your complete response here. You have no preparation time. Respond as you would in the actual situation..."
                  style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '14px', color: '#1C2B5E', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6, marginBottom: 14 }}
                  onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
                <button className="btn-primary" onClick={scoreWrittenResponse} disabled={!writtenResponse.trim() || loading}>
                  Submit for AI Certification Scoring →
                </button>
                {writtenFeedback && (
                  <div style={{ marginTop: 20, background: '#F4F6F9', borderRadius: 8, padding: 16, borderLeft: '3px solid #1C2B5E' }}>
                    <span className="label">Official Certification Assessment</span>
                    {loading ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {[0,1,2].map(n => <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />)}
                      </div>
                    ) : (
                      <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
                        {writtenFeedback.split('\n').map((line, i) => (
                          <div key={i} style={{ fontWeight: line.startsWith('##') ? 700 : 400, color: line.startsWith('##') ? C.gold : C.offWhite, fontSize: line.startsWith('##') ? 11 : 14, letterSpacing: line.startsWith('##') ? 1.5 : 0, textTransform: line.startsWith('##') ? 'uppercase' : 'none', marginTop: line.startsWith('##') ? 14 : 0, marginBottom: line.startsWith('##') ? 4 : 2 }}>
                            {line.replace(/^##\s*/, '')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {certSection === 'verbal' && (
              <div className="card fade-up" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎭</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Verbal Simulation</div>
                <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>The verbal simulation uses the full Role-Play engine with no preparation time and harder AI pushback. Complete this after the written scenario.</div>
                <Link href="/simulation" className="btn-primary">Go to Role-Play Simulations →</Link>
              </div>
            )}
          </div>
        )}

        {/* DM VALIDATION TAB */}
        {activeTab === 'dm' && (
          <div>
            <div className="card fade-up" style={{ marginBottom: 16 }}>
              <span className="label">District Manager Validation — Days 46–50</span>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 14 }}>
                After the AI assessment, your District Manager reviews results, observed meeting notes, and submitted field work. DM sign-off is required for full certification. Use this section to document observations and prepare for the validation conversation.
              </p>
            </div>
            <div className="card fade-up-1" style={{ marginBottom: 16 }}>
              <span className="label">DM Observation Notes</span>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Document specific observations from the participant's account — client meetings attended, recovery situations handled, QBR delivery observed.</p>
              <textarea value={dmObservations} onChange={e => setDmObservations(e.target.value)} rows={5} placeholder="e.g. Observed participant deliver proactive call to VP Student Life after survey results released. Led with data, proposed specific action plan. Did not deflect on speed of service gap. Follow-up sent same day as committed..."
                style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '12px 14px', color: '#1C2B5E', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
            </div>
            <div className="card fade-up-2" style={{ marginBottom: 16 }}>
              <span className="label">90-Day Development Plan Notes</span>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Identify the 1-2 dimensions that need continued focus based on AI scores and field observations.</p>
              <textarea value={dmNotes} onChange={e => setDmNotes(e.target.value)} rows={4} placeholder="e.g. AI scores show Data Discipline as the persistent gap — participant understands the framework but reverts to operational language under pressure. Focus for Q3: one CFO conversation with DM present per period..."
                style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '12px 14px', color: '#1C2B5E', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Certified — Client Ready', color: C.green, desc: 'AI score 80%+, no critical failure, DM validated' },
                { label: 'Conditional — Field Coaching', color: '#b87333', desc: 'AI score 65–79% or DM concern identified' },
                { label: 'Not Yet Certified', color: C.red, desc: 'AI score below 65% or critical failure dimension' },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}11`, border: `1px solid ${s.color}`, borderRadius: 8, padding: 14, cursor: 'pointer' }}>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
