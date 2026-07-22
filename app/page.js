'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { MODULES, INDUSTRIES, TRAINING_TYPES } from '../lib/data'

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const [started, setStarted] = useState(false)
  const [industry, setIndustry] = useState(null)
  const [trainingType, setTrainingType] = useState(null)
  const modules = MODULES.filter(m => !m.adminOnly || session?.user?.role === 'admin')

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
          Executive Communication Training
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, marginTop: 6 }}>
          Executive Communication Training Platform
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
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Source Sans 3, sans-serif', marginBottom: 2 }}>{industry ? industry.label : 'Executive Communication Training'}</div>
            <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, fontFamily: 'Source Sans 3, sans-serif' }}>{trainingType ? trainingType.label : 'Executive Communication Training Platform'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/industry" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, textDecoration: 'none', letterSpacing: 0.5 }}>Change Industry</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(13,148,136,0.18)', border: '1px solid rgba(13,148,136,0.4)', borderRadius: 6, padding: '6px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0D9488' }} />
            <span style={{ color: '#99F1E8', fontSize: 11, fontWeight: 600, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: 1 }}>AI COACHING ENABLED</span>
          </div>
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
          <div style={{ display: 'inline-block', background: '#0D9488', color: '#FFFFFF', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 4, marginBottom: 16 }}>
            Proof of Concept · Enterprise Edition
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 900, color: '#1C2B5E', lineHeight: 1.15, marginBottom: 14 }}>
            The contract is won by sales.<br />
            <span style={{ color: '#0D9488' }}>It is retained by operators.</span>
          </h1>
          <p style={{ color: '#374151', fontSize: 16, lineHeight: 1.8, maxWidth: 620, marginBottom: 32 }}>
            On-demand leadership communication training — ready when you are. Practice the exact conversations that define your career: executive escalations, client financial reviews, service recovery, and stakeholder management. No scheduled bootcamp required. Train when the moment calls for it, scored in real time against a five-dimension certification rubric.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['5','Rubric Dimensions'],['4','Live Simulations'],['45-Day','Cert Window'],['80%+','Required to Certify'],['AI-Scored','Field Assessment']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center', padding: '14px 20px', background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', minWidth: 110 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1C2B5E', fontFamily: 'monospace', marginBottom: 3 }}>{val}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: '#D1D5DB', marginBottom: 28 }} />

        <div className="fade-up-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ color: '#1C2B5E', fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>Training Modules</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Start with the Diagnostic to personalize your learning path</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14, marginBottom: 40 }}>
          {modules.map((mod, i) => {
            const isStart = mod.id === 'diagnostic'
            return (
              <Link key={mod.id} href={mod.href} style={{ textDecoration: 'none' }}>
                <div
                  className={`fade-up-${Math.min(i+1, 5)}`}
                  style={{ background: '#FFFFFF', border: `1.5px solid ${isStart ? '#1C2B5E' : '#D1D5DB'}`, borderRadius: 10, padding: '18px 20px', boxShadow: isStart ? '0 2px 12px rgba(28,43,94,0.12)' : '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1C2B5E'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(28,43,94,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isStart ? '#1C2B5E' : '#D1D5DB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isStart ? '0 2px 12px rgba(28,43,94,0.12)' : '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: '#F4F6F9', border: '1.5px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{mod.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>{mod.day}</span>
                        {isStart && <span style={{ fontSize: 10, background: '#1C2B5E', color: '#FFFFFF', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>START HERE</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1C2B5E', marginBottom: 4 }}>{mod.label}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{mod.desc}</div>
                    </div>
                    <div style={{ color: '#1C2B5E', fontSize: 18, flexShrink: 0, fontWeight: 700 }}>›</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderLeft: '4px solid #1C2B5E', borderRadius: 8, padding: '14px 20px', fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
          <strong style={{ color: '#1C2B5E' }}>Certification path:</strong> Complete the Diagnostic → build your Stakeholder Map → complete Role-Play Simulations → master Financial Storytelling → deliver your QBR. Full certification requires 80%+ on the AI-scored Day 45 field assessment plus District Manager validation.
        </div>
      </div>
    </div>
  )
}
