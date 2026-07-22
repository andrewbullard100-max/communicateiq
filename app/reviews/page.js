'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { C } from '../../lib/data'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function ReviewsPage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState('queue')
  const [queue, setQueue] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState(null)

  const loadQueue = () => {
    setLoading(true)
    fetch('/api/admin/reviews/queue')
      .then(async res => {
        if (res.status === 403) { setForbidden(true); setLoading(false); return }
        const data = await res.json()
        setQueue(data.queue || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    loadQueue()
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'stats') return
    fetch('/api/admin/reviews/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(() => {})
  }, [status, tab])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (status === 'loading' || loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray }}>Loading…</div>
  }

  if (forbidden) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.navy }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6 }}>Scoring Review</div>
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 18 }}>Restricted to content_approver accounts and above.</div>
          <Link href="/" style={{ color: C.communicateiqRed, fontSize: 13, fontWeight: 600 }}>← Back to home</Link>
        </div>
      </div>
    )
  }

  if (selectedId) {
    return (
      <ReviewDetail
        attemptId={selectedId}
        onBack={() => setSelectedId(null)}
        onSubmitted={() => { setSelectedId(null); loadQueue(); setToast({ type: 'success', text: 'Review submitted.' }) }}
        onError={msg => setToast({ type: 'error', text: msg })}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: C.gold, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Scoring Review</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{session?.user?.name || session?.user?.email}</div>
        </div>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>← Home</Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['queue', 'stats'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t ? C.gold : '#fff', color: tab === t ? '#fff' : C.gold }}>
              {t === 'queue' ? `Queue (${queue.length})` : 'Validation Stats'}
            </button>
          ))}
        </div>

        {tab === 'queue' && (
          <>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>
              Attempts with a retained transcript that haven't been independently scored yet. Score the same dimensions the AI did, blind to its scores where it matters — the goal is an honest agreement measurement, not confirming the AI was right.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {queue.map(item => (
                <button key={item.id} onClick={() => setSelectedId(item.id)}
                  style={{ textAlign: 'left', background: '#fff', border: 'none', borderRadius: 10, padding: 16, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.gold, fontSize: 14 }}>{item.scenarioLabel || item.trainingType || 'Attempt'}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.userName} ({item.userEmail}) · {fmtDate(item.completedAt)}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.trainingType}</div>
                  </div>
                </button>
              ))}
              {!queue.length && (
                <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  Nothing waiting for review. This is either a good sign (everything's been reviewed) or means transcripts aren't being retained — check your org's transcript retention setting.
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'stats' && <StatsPanel stats={stats} />}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? C.red : C.green, color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.text}
        </div>
      )}
    </div>
  )
}

function StatsPanel({ stats }) {
  if (!stats) return <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
  if (!stats.reviewedCount) {
    return (
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
        No human reviews yet — agreement stats need at least a few reviewed attempts to mean anything.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 12, color: '#6B7280' }}>
        {stats.reviewedCount} attempt{stats.reviewedCount === 1 ? '' : 's'} reviewed. Mean absolute difference is the average gap between the AI's score and the human reviewer's score for that dimension, on the same 1–4 scale — 0 is perfect agreement, 1+ means they're regularly a full point apart.
      </div>
      {Object.entries(stats.byTrainingType).map(([trainingType, data]) => (
        <div key={trainingType} style={{ background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: C.gold, marginBottom: 10, textTransform: 'capitalize' }}>
            {trainingType} <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12 }}>({data.attemptCount} reviewed)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(data.dimensions).map(([dim, d]) => (
              <div key={dim} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#374151', textTransform: 'capitalize' }}>{dim.replace(/([A-Z])/g, ' $1')}</span>
                <span style={{ fontWeight: 700, color: d.meanAbsoluteDifference > 0.75 ? C.red : d.meanAbsoluteDifference > 0.35 ? '#b87333' : C.green }}>
                  {d.meanAbsoluteDifference} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(n={d.n})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewDetail({ attemptId, onBack, onSubmitted, onError }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAiScores, setShowAiScores] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/reviews/${attemptId}`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        // Pre-seed the score keys (not values) from the AI's dimensions so
        // the form has the right fields, without pre-filling the AI's
        // numbers — that would defeat the point of an independent score.
        const dims = Object.keys(d.attempt?.aiScores || {})
        setScores(Object.fromEntries(dims.map(k => [k, ''])))
      })
      .finally(() => setLoading(false))
  }, [attemptId])

  async function handleSubmit() {
    const parsed = {}
    for (const [k, v] of Object.entries(scores)) {
      const n = Number(v)
      if (!v || Number.isNaN(n) || n < 1 || n > 4) {
        onError(`Enter a score from 1–4 for every dimension (missing or invalid: ${k}).`)
        return
      }
      parsed[k] = n
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/reviews/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: parsed, notes }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to submit review')
      onSubmitted()
    } catch (err) {
      onError(err.message)
      setSubmitting(false)
    }
  }

  if (loading || !data) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray }}>Loading…</div>
  }

  const { attempt, transcript } = data

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: C.gold, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Back to queue</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: C.gold }}>{attempt.scenarioLabel || attempt.trainingType}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{attempt.userName} ({attempt.userEmail}) · {fmtDate(attempt.completedAt)}</div>
        </div>

        {transcript ? (
          <div style={{ background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxHeight: 340, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Transcript</div>
            {transcript.map((m, i) => (
              <div key={i} style={{ marginBottom: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: m.role === 'user' ? C.communicateiqRed : C.gold }}>
                  {m.role === 'user' ? 'Trainee' : 'AI Persona'}:
                </span>{' '}
                <span style={{ color: '#374151' }}>{m.content}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#FDECEC', borderRadius: 10, padding: 14, fontSize: 13, color: C.red }}>
            No transcript available for this attempt (expired or not retained).
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: C.gold, marginBottom: 10 }}>Your Score</div>
          {Object.keys(scores).map(dim => (
            <div key={dim} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{dim.replace(/([A-Z])/g, ' $1')}</label>
              <select value={scores[dim]} onChange={e => setScores(s => ({ ...s, [dim]: e.target.value }))}
                style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', width: 90 }}>
                <option value="">—</option>
                <option value="1">1 — Weak</option>
                <option value="2">2 — Developing</option>
                <option value="3">3 — Proficient</option>
                <option value="4">4 — Distinguished</option>
              </select>
            </div>
          ))}
          <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginTop: 8, marginBottom: 4 }}>Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, fontFamily: 'inherit' }} />

          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.communicateiqRed, color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button onClick={() => setShowAiScores(s => !s)}
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
              {showAiScores ? 'Hide' : 'Reveal'} AI's scores
            </button>
          </div>

          {showAiScores && (
            <div style={{ marginTop: 12, padding: 12, background: '#F8F9FB', borderRadius: 8, fontSize: 12, color: '#6B7280' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>AI scores ({attempt.aiModelVersion})</div>
              {Object.entries(attempt.aiScores || {}).map(([dim, v]) => (
                <div key={dim} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ textTransform: 'capitalize' }}>{dim.replace(/([A-Z])/g, ' $1')}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
