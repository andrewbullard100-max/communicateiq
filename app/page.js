'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { CORE_FLOW, SECONDARY_MODULES, INDUSTRIES, TRAINING_TYPES } from '../lib/data'

// Any role above plain learner can see the "Console →" link to the Admin
// Console — the console itself further restricts which tabs each of these
// roles actually sees (see lib/auth.js's TEAM_VIEW_ROLES / ADMIN_CONSOLE_ROLES
// / REVIEWER_ROLES / CONTENT_ROLES, mirrored in app/admin/page.js).
const ELEVATED_ROLES = ['manager', 'content_author', 'content_approver', 'org_admin', 'corporate_admin']

// Same role set as the Admin Console's Content Upload tab (CONTENT_ROLES in
// app/admin/page.js) — kept as its own visible top-nav link rather than
// buried inside the console, since building scenarios is a distinct,
// frequent action for these roles, not an admin task.
const CONTENT_ROLES = ['content_author', 'content_approver', 'org_admin', 'corporate_admin']

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const [started, setStarted] = useState(false)
  const [industry, setIndustry] = useState(null)
  const [trainingType, setTrainingType] = useState(null)
  const [progress, setProgress] = useState({ diagnostic: false, stakeholder: false, simulation: false, financial: false, qbr: false })
  const hasConsoleAccess = ELEVATED_ROLES.includes(session?.user?.role)
  const hasContentAccess = CONTENT_ROLES.includes(session?.user?.role)

  // Check sessionStorage so navigating back doesn't re-show splash
  useEffect(() => {
    if (typeof window === 'undefined') return
    const indId = sessionStorage.getItem('selectedIndustry')
    const typeId = sessionStorage.getItem('selectedTrainingType')
    if (sessionStorage.getItem('platformStarted') && indId && typeId) {
      setIndustry(INDUSTRIES.find(i => i.id === indId) || null)
      setTrainingType((TRAINING_TYPES[indId] || []).find(t => t.id === typeId) || null)
      setStarted(true)
    }
  }, [])

  // Best-effort progress signal for the guided flow below — not a strict
  // gate (see app/page.js's stepper rendering), just enough to show what's
  // done. Simulation/QBR come from persisted attempts; Stakeholder Mapping
  // and Diagnostic don't persist server-side yet, so they read the
  // local/session flags those pages already set on completion.
  useEffect(() => {
    if (typeof window === 'undefined' || !session?.user) return
    setProgress(p => ({
      ...p,
      diagnostic: sessionStorage.getItem('communicateiq_diagnostic_complete') === '1',
      financial: sessionStorage.getItem('communicateiq_financial_complete') === '1',
      stakeholder: (() => {
        try { return JSON.parse(localStorage.getItem('communicateiq_stakeholders') || '[]').length > 0 }
        catch { return false }
      })(),
    }))
    fetch('/api/results?scope=self')
      .then(res => res.json())
      .then(data => {
        const attempts = data.results || []
        setProgress(p => ({
          ...p,
          simulation: attempts.some(r => r.moduleKey === 'simulation'),
          qbr: attempts.some(r => r.moduleKey === 'qbr'),
        }))
      })
      .catch(() => {})
  }, [session?.user])

  if (!started) return (
    <div style={{
      minHeight: '100vh', background: '#1C2B5E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: 48, color: '#FFFFFF', letterSpacing: '-1px', lineHeight: 1 }}>
          Communicate<span style={{ color: '#0D9488' }}>IQ</span>
        </div>
        <div style={{ height: 4, background: '#0D9488', borderRadius: 2, marginTop: 6 }} />
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginTop: 14 }}>
          Food Service Leadership Training
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, marginTop: 6 }}>
          Contract Dining & Food Service Leadership Platform
        </div>
      </div>

      <button
        onClick={() => {
          try {
            const u = new SpeechSynthesisUtterance('')
            window.speechSynthesis.speak(u)
          } catch {}
          try {
            const Ctx = window.AudioContext || window.webkitAudioContext
            if (Ctx) { const ctx = new Ctx(); ctx.resume() }
          } catch {}
          const indId = sessionStorage.getItem('selectedIndustry')
          const typeId = sessionStorage.getItem('selectedTrainingType')
          if (indId && typeId) {
            sessionStorage.setItem('platformStarted', '1')
            setIndustry(INDUSTRIES.find(i => i.id === indId) || null)
            setTrainingType((TRAINING_TYPES[indId] || []).find(t => t.id === typeId) || null)
            setStarted(true)
          } else {
            router.push('/industry')
          }
        }}
        style={{
          background: '#0D9488', color: '#FFFFFF', border: 'none',
          borderRadius: 10, padding: '18px 48px', fontSize: 17,
          fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5,
          boxShadow: '0 4px 24px rgba(13,148,136,0.4)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Enter Training Platform →
      </button>

      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
        Click to begin · Audio enabled
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ background: '#1C2B5E', borderBottom: '4px solid #0D9488', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: 28, color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1 }}>
              Communicate<span style={{ color: '#0D9488' }}>IQ</span>
            </div>
            <div style={{ height: 3, background: '#0D9488', borderRadius: 2, width: '100%' }} />
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Source Sans 3, sans-serif', marginBottom: 2 }}>{industry ? industry.label : 'Food Service Leadership Training'}</div>
            <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, fontFamily: 'Source Sans 3, sans-serif' }}>{trainingType ? trainingType.label : 'Contract Dining & Food Service Leadership Platform'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/industry" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, textDecoration: 'none', letterSpacing: 0.5 }}>Change Industry</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(13,148,136,0.18)', border: '1px solid rgba(13,148,136,0.4)', borderRadius: 6, padding: '6px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0D9488' }} />
            <span style={{ color: '#99F1E8', fontSize: 11, fontWeight: 600, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: 1 }}>AI COACHING ENABLED</span>
          </div>
          {hasContentAccess && (
            <Link href="/admin?tab=policies" style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, textDecoration: 'none', letterSpacing: 0.5, background: '#0D9488', borderRadius: 6, padding: '6px 12px' }}>
              Create Scenarios →
            </Link>
          )}
          {hasConsoleAccess && (
            <Link href="/admin" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, textDecoration: 'none', letterSpacing: 0.5, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6, padding: '6px 12px' }}>
              Console →
            </Link>
          )}
          {session?.user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{session.user.name || session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '44px 28px' }}>
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 900, color: '#1C2B5E', lineHeight: 1.15, marginBottom: 14 }}>
            The contract is won by sales.<br />
            <span style={{ color: '#0D9488' }}>It is retained by operators.</span>
          </h1>
          <p style={{ color: '#374151', fontSize: 16, lineHeight: 1.8, maxWidth: 620, marginBottom: 32 }}>
            On-demand leadership communication training — ready when you are. Practice the exact conversations that define your career: executive escalations, client financial reviews, service recovery, and stakeholder management. No scheduled bootcamp required. Train when the moment calls for it, scored in real time against a five-dimension certification rubric.
          </p>
        </div>

        <div style={{ height: 1, background: '#D1D5DB', marginBottom: 28 }} />

        <div className="fade-up-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ color: '#1C2B5E', fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>Your Certification Path</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Work through each step in order — jump ahead any time</div>
        </div>

        {(() => {
          const completedFlags = { ...progress, dashboard: false }
          const firstIncomplete = CORE_FLOW.findIndex(m => !completedFlags[m.id])
          return (
            <div style={{ position: 'relative', marginBottom: 36 }}>
              <div style={{ position: 'absolute', left: 27, top: 8, bottom: 8, width: 2, background: '#D1D5DB' }} />
              {CORE_FLOW.map((mod, i) => {
                const isDone = completedFlags[mod.id]
                const isCurrent = !isDone && (firstIncomplete === -1 ? i === CORE_FLOW.length - 1 : i === firstIncomplete)
                const status = isDone ? 'done' : isCurrent ? 'current' : 'upcoming'
                const dotColor = status === 'done' ? '#0D9488' : status === 'current' ? '#1C2B5E' : '#FFFFFF'
                return (
                  <Link key={mod.id} href={mod.href} style={{ textDecoration: 'none' }}>
                    <div
                      className={`fade-up-${Math.min(i + 1, 5)}`}
                      style={{
                        position: 'relative', display: 'flex', gap: 16, alignItems: 'center',
                        background: status === 'upcoming' ? '#F4F6F9' : '#FFFFFF',
                        border: `1.5px solid ${status === 'current' ? '#1C2B5E' : '#D1D5DB'}`,
                        borderRadius: 10, padding: '14px 20px', marginBottom: 10, cursor: 'pointer',
                        opacity: status === 'upcoming' ? 0.75 : 1,
                        boxShadow: status === 'current' ? '0 2px 12px rgba(28,43,94,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                        background: dotColor, border: `2px solid ${status === 'upcoming' ? '#D1D5DB' : dotColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17, color: status === 'upcoming' ? '#6B7280' : '#FFFFFF', fontWeight: 700,
                      }}>
                        {isDone ? '✓' : mod.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>{mod.day}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 10,
                            background: status === 'done' ? 'rgba(13,148,136,0.15)' : status === 'current' ? 'rgba(28,43,94,0.1)' : '#EDEFF2',
                            color: status === 'done' ? '#0D9488' : status === 'current' ? '#1C2B5E' : '#9CA3AF',
                          }}>
                            {status === 'done' ? 'Completed' : status === 'current' ? 'Current' : 'Not Started'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1C2B5E', marginBottom: 2 }}>{mod.label}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{mod.desc}</div>
                      </div>
                      <div style={{ color: '#1C2B5E', fontSize: 18, flexShrink: 0, fontWeight: 700 }}>›</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        })()}

        <div className="fade-up-1" style={{ marginBottom: 14, color: '#1C2B5E', fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>More</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {SECONDARY_MODULES.map(mod => (
            <Link key={mod.id} href={mod.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: '#F4F6F9', border: '1.5px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{mod.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1C2B5E' }}>{mod.label}</div>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>{mod.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
