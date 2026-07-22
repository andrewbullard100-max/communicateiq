'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { INDUSTRIES, TRAINING_TYPES } from '../../lib/data'

export default function TrainingTypeSelect() {
  const router = useRouter()
  const [industry, setIndustry] = useState(null)
  const [types, setTypes] = useState([])

  useEffect(() => {
    const id = typeof window !== 'undefined' ? sessionStorage.getItem('selectedIndustry') : null
    if (!id) { router.replace('/industry'); return }
    const ind = INDUSTRIES.find(i => i.id === id)
    setIndustry(ind)
    setTypes(TRAINING_TYPES[id] || [])
  }, [router])

  function choose(type) {
    sessionStorage.setItem('selectedTrainingType', type.id)
    sessionStorage.setItem('platformStarted', '1')
    router.push('/')
  }

  if (!industry) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ background: '#1C2B5E', borderBottom: '4px solid #0D9488', padding: '0 32px', display: 'flex', alignItems: 'center', height: 68 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: 26, color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1 }}>
            Communicate<span style={{ color: '#0D9488' }}>IQ</span>
          </div>
          <div style={{ height: 3, background: '#0D9488', borderRadius: 2, width: '100%' }} />
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '52px 28px' }}>
        <Link href="/industry" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px', display: 'inline-block', marginBottom: 24 }}>
          ← Change Industry
        </Link>
        <div style={{ display: 'inline-block', background: '#0D9488', color: '#FFFFFF', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 4, marginBottom: 16 }}>
          Step 2 of 2 · {industry.label}
        </div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 900, color: '#1C2B5E', marginBottom: 10 }}>
          Choose your training type
        </h1>
        <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.7, maxWidth: 620, marginBottom: 36 }}>
          Pick the set of conversations you want to practice for {industry.label}.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {types.map((t, i) => (
            <div
              key={t.id}
              onClick={() => choose(t)}
              className={`fade-up-${Math.min(i + 1, 5)}`}
              style={{ background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderRadius: 12, padding: '26px 22px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <div style={{ fontSize: 30, marginBottom: 12 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1C2B5E', marginBottom: 6 }}>{t.label}</div>
              <div style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.6 }}>{t.desc}</div>
              <div style={{ marginTop: 14, color: '#0D9488', fontSize: 12, fontWeight: 700 }}>Select →</div>
            </div>
          ))}
          {types.length === 0 && (
            <div style={{ color: '#6B7280', fontSize: 13 }}>No training types configured for this industry yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
