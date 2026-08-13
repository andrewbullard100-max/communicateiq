'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { C, DIMENSIONS, LEVEL_LABELS, INDUSTRIES } from '../../lib/data'
import { computeCompetencyTrend, dimensionLabel, summarizeForCoaching } from '../../lib/analytics'

const MODULE_LABEL = { simulation: 'Client Role-Play Simulation', leadership: 'Leadership Simulation', qbr: 'QBR Delivery' }

function avg(nums) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function flagFor(user, trend) {
  const currents = Object.values(trend.dimensions).map(d => d.current)
  const overall = avg(currents)
  const anyWeak = currents.some(v => v < 2)
  const lastStatus = user.results[0]?.certificationStatus || ''
  const notYetCount = user.results.filter(r => (r.certificationStatus || '').startsWith('Not Yet')).length

  if (anyWeak || overall < 2.5 || notYetCount >= 2) {
    return { level: 'red', label: 'Needs Coaching' }
  }
  if (overall < 3.0 || lastStatus.startsWith('Conditional')) {
    return { level: 'yellow', label: 'Watch' }
  }
  return { level: 'green', label: 'On Track' }
}

const FLAG_COLOR = { red: '#C00000', yellow: '#b87333', green: C.green }
const FLAG_ICON = { red: '🔴', yellow: '🟡', green: '🟢' }

export default function TeamDashboard() {
  const { data: session, status } = useSession()
  const [results, setResults] = useState([])
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [industryFilter, setIndustryFilter] = useState('all')
  const [assignTarget, setAssignTarget] = useState(null) // the user card being assigned training, or null
  const [assignBusy, setAssignBusy] = useState(false)
  const [assignToast, setAssignToast] = useState(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/results?scope=team')
      .then(async res => {
        if (res.status === 403) { setForbidden(true); setLoading(false); return }
        const data = await res.json()
        setResults(data.results || [])
        setConfigured(data.configured !== false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status])

  async function handleAssignTraining(user, dueInDays) {
    if (!user.coaching) return
    setAssignBusy(true)
    try {
      const dueAt = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000).toISOString()
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${user.coaching.developmentOpportunity} Coaching — ${user.name}`,
          description: user.coaching.coachingTip,
          moduleKeys: [user.coaching.recommendedModuleKey],
          targetType: 'user',
          targetId: user.userId,
          dueAt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign training')
      setAssignToast({ type: 'success', text: `Assigned to ${user.name}.` })
      setAssignTarget(null)
    } catch (err) {
      setAssignToast({ type: 'error', text: err.message })
    } finally {
      setAssignBusy(false)
    }
  }

  useEffect(() => {
    if (!assignToast) return
    const t = setTimeout(() => setAssignToast(null), 4000)
    return () => clearTimeout(t)
  }, [assignToast])

  const filtered = useMemo(
    () => industryFilter === 'all' ? results : results.filter(r => r.industry === industryFilter),
    [results, industryFilter]
  )

  const byUser = useMemo(() => {
    const map = {}
    filtered.forEach(r => {
      const key = r.userEmail || 'unknown'
      if (!map[key]) map[key] = { email: r.userEmail, name: r.userName || r.userEmail, userId: r.userId, results: [], industries: new Set() }
      map[key].results.push(r)
      if (r.industry) map[key].industries.add(r.industry)
    })
    return Object.values(map).map(u => {
      const sorted = [...u.results].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      const trend = computeCompetencyTrend(u.results)
      const user = { ...u, results: sorted, trend, lastActivity: sorted[0]?.timestamp || 0 }
      user.flag = flagFor(user, trend)
      user.overall = trend.overall?.current || 0
      user.coaching = summarizeForCoaching(trend)
      return user
    }).sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 }
      if (order[a.flag.level] !== order[b.flag.level]) return order[a.flag.level] - order[b.flag.level]
      return a.name.localeCompare(b.name)
    })
  }, [filtered])

  // Org-wide trend across every scored dimension present in the filtered set
  // (Simulation/Leadership's five plus QBR's separate five) — drives both the
  // roster's dimension columns and the "Team-Wide Pattern" callout below.
  const orgTrend = useMemo(() => computeCompetencyTrend(filtered), [filtered])
  const rosterDimIds = useMemo(() => Object.keys(orgTrend.dimensions), [orgTrend])

  const weakestDim = useMemo(() => {
    const entries = Object.entries(orgTrend.dimensions).filter(([, d]) => d.n > 0)
    if (!entries.length) return null
    return entries.sort((a, b) => a[1].current - b[1].current)[0]
  }, [orgTrend])

  const flaggedCount = byUser.filter(u => u.flag.level !== 'green').length
  const redCount = byUser.filter(u => u.flag.level === 'red').length

  if (status === 'loading' || loading) return null

  if (forbidden) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#1C2B5E' }}>Admin Access Required</div>
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 18 }}>The Team Dashboard is restricted to manager accounts and above.</div>
          <Link href="/" className="btn-primary">Back to Platform</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>Manager View · {session?.user?.name || session?.user?.email}</span>
        </div>

        <span className="label">Manager View</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 8 }}>Team Dashboard</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
          Live progress across everyone practicing on this instance, aggregated from completed simulation scores.
        </p>

        {!configured && (
          <div className="card fade-up" style={{ marginBottom: 20, borderLeft: '4px solid #b87333' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#b87333', marginBottom: 4 }}>Results storage not connected yet</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
              Simulation scores aren't being saved because Redis storage isn't configured. Connect it from Vercel Dashboard → Storage → Redis, then redeploy — see DEPLOY.md for the exact steps. Nothing else changes; results start appearing here automatically once it's connected.
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            ['Trainees Active', byUser.length, '#1C2B5E'],
            ['Scenarios Completed', filtered.length, '#1C2B5E'],
            ['Flagged for Follow-Up', flaggedCount, flaggedCount ? '#b87333' : C.green],
            ['Needs Coaching Now', redCount, redCount ? '#C00000' : C.green],
          ].map(([label, val, color]) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color }}>{val}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Industry filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => setIndustryFilter('all')}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${industryFilter === 'all' ? '#1C2B5E' : '#D1D5DB'}`, background: industryFilter === 'all' ? '#1C2B5E' : '#FFFFFF', color: industryFilter === 'all' ? '#FFFFFF' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >All Industries</button>
          {INDUSTRIES.map(ind => (
            <button
              key={ind.id}
              onClick={() => setIndustryFilter(ind.id)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${industryFilter === ind.id ? '#1C2B5E' : '#D1D5DB'}`, background: industryFilter === ind.id ? '#1C2B5E' : '#FFFFFF', color: industryFilter === ind.id ? '#FFFFFF' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >{ind.icon} {ind.label}</button>
          ))}
        </div>

        {/* Org-wide weak spot */}
        {weakestDim && (
          <div className="card fade-up" style={{ marginBottom: 20, borderLeft: '4px solid #1C2B5E' }}>
            <span className="label">Team-Wide Pattern</span>
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Across {filtered.length} completed scenarios, <strong>{weakestDim[1].label}</strong> is the lowest-scoring dimension team-wide, averaging {weakestDim[1].current.toFixed(1)}/4. If this shows up across multiple people rather than one individual, it's worth a group coaching session rather than one-off feedback.
            </p>
          </div>
        )}

        {/* Roster */}
        <div className="fade-up-1" style={{ marginBottom: 12, color: '#1C2B5E', fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>
          Roster
        </div>

        {byUser.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: '#6B7280', fontSize: 13 }}>
            No completed simulations yet{industryFilter !== 'all' ? ' for this industry' : ''}.
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {byUser.map((u, i) => (
            <div key={u.email} className={`card fade-up-${Math.min(i + 1, 5)}`} style={{ borderLeft: `4px solid ${FLAG_COLOR[u.flag.level]}` }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 15 }}>{FLAG_ICON[u.flag.level]}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1C2B5E' }}>{u.name}</span>
                    <span style={{ fontSize: 10, color: FLAG_COLOR[u.flag.level], fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{u.flag.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{u.email}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 4 }}>
                    {u.results.length} scenario{u.results.length !== 1 ? 's' : ''} · {[...u.industries].map(id => INDUSTRIES.find(x => x.id === id)?.label || id).join(', ') || '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {rosterDimIds.map(id => {
                    const d = u.trend.dimensions[id]
                    const v = d?.current
                    return (
                      <div key={id} style={{ textAlign: 'center', minWidth: 56 }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{dimensionLabel(id).split(' ')[0]}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: v ? (v < 2 ? '#C00000' : v < 2.5 ? '#b87333' : C.green) : '#D1D5DB' }}>
                          {v ? v.toFixed(1) : '—'}
                        </div>
                        {d && d.direction !== 'insufficient' && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: d.direction === 'up' ? C.green : d.direction === 'down' ? '#C00000' : '#9CA3AF' }}>
                            {d.direction === 'up' ? `↑${d.delta.toFixed(1)}` : d.direction === 'down' ? `↓${Math.abs(d.delta).toFixed(1)}` : '→'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Last Activity</div>
                  <div style={{ fontSize: 12, color: '#374151' }}>
                    {u.lastActivity ? new Date(u.lastActivity).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>

              {u.coaching && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #EAECF0', fontSize: 12, color: '#6B7280' }}>
                  <div>
                    Strength: <strong style={{ color: '#374151' }}>{u.coaching.strength}</strong> ({u.coaching.strengthScore.toFixed(1)}) · Development opportunity: <strong style={{ color: '#374151' }}>{u.coaching.developmentOpportunity}</strong> ({u.coaching.developmentScore.toFixed(1)})
                    {u.results[0] && <> · Most recent: <strong style={{ color: '#374151' }}>{u.results[0].scenarioTitle}</strong> — {u.results[0].certificationStatus}</>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, fontSize: 11.5, color: '#6B7280', fontStyle: 'italic' }}>
                      Suggested coaching: {u.coaching.coachingTip}
                    </div>
                    {u.userId && (
                      <button onClick={() => setAssignTarget(u)}
                        style={{ fontSize: 11.5, whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.gold}`, background: '#fff', color: C.gold, fontWeight: 600, cursor: 'pointer' }}>
                        Assign {MODULE_LABEL[u.coaching.recommendedModuleKey] || u.coaching.recommendedModuleKey} →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {assignTarget && (
        <AssignTrainingModal
          user={assignTarget}
          busy={assignBusy}
          onCancel={() => setAssignTarget(null)}
          onConfirm={dueInDays => handleAssignTraining(assignTarget, dueInDays)}
        />
      )}
      {assignToast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: assignToast.type === 'error' ? '#C00000' : C.green, color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 60 }}>
          {assignToast.text}
        </div>
      )}
    </div>
  )
}

function AssignTrainingModal({ user, busy, onCancel, onConfirm }) {
  const [dueInDays, setDueInDays] = useState(14)
  const { coaching } = user

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 420 }}>
        <div style={{ fontWeight: 700, color: C.gold, marginBottom: 4, fontSize: 15 }}>Assign Training</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>For {user.name} ({user.email})</div>

        <div style={{ background: '#F4F6F9', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Development opportunity</div>
          <div style={{ fontWeight: 700, color: '#374151', fontSize: 14, marginBottom: 8 }}>{coaching.developmentOpportunity} ({coaching.developmentScore.toFixed(1)}/4)</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Suggested coaching</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>{coaching.coachingTip}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            Recommended module: <strong style={{ color: '#374151' }}>{MODULE_LABEL[coaching.recommendedModuleKey] || coaching.recommendedModuleKey}</strong>
          </div>
        </div>

        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Due in</label>
        <select value={dueInDays} onChange={e => setDueInDays(Number(e.target.value))}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 20, fontSize: 13 }}>
          <option value={7}>1 week</option>
          <option value={14}>2 weeks</option>
          <option value={30}>30 days</option>
        </select>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button
            disabled={busy}
            onClick={() => onConfirm(dueInDays)}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: C.communicateiqRed, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Assigning…' : 'Assign Training'}
          </button>
        </div>
      </div>
    </div>
  )
}
