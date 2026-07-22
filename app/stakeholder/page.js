'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { C, callAI, getSelectedIndustryId, getIndustryConfig } from '../../lib/data'

const emptyContact = () => ({
  name: '', title: '', cares: '', relationship: '', lastContact: '', influence: '',
})

export default function StakeholderPage() {
  const [industryId, setIndustryId] = useState('higher-ed')
  useEffect(() => { setIndustryId(getSelectedIndustryId()) }, [])
  const cfg = getIndustryConfig(industryId)

  const [account, setAccount] = useState('')
  const [formal, setFormal] = useState(
    cfg.stakeholderRoles.map(r => ({ ...r, name: '', relationship: '3', lastContact: '' }))
  )
  // Rebuild the formal-role rows whenever the industry resolves (post-mount)
  // so the table isn't stuck on the higher-ed default set.
  useEffect(() => {
    setFormal(cfg.stakeholderRoles.map(r => ({ ...r, name: '', relationship: '3', lastContact: '' })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryId])
  const [informal, setInformal] = useState([emptyContact(), emptyContact(), emptyContact()])
  const [riskRelationship, setRiskRelationship] = useState('')
  const [riskAction, setRiskAction] = useState('')
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState(null)
  const [activeTab, setActiveTab] = useState('map') // map | review

  function updateFormal(i, field, val) {
    setFormal(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function updateInformal(i, field, val) {
    setInformal(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function addInformal() { setInformal(prev => [...prev, emptyContact()]) }

  const filledInformal = informal.filter(c => c.name.trim())
  const canReview = filledInformal.length >= 3 && formal.filter(f => f.name.trim()).length >= 3

  async function getAIReview() {
try {
  const stakeholderMap = { account, industry: industryId }
  formal.forEach(f => {
    if (!f.name.trim() || !f.key) return
    stakeholderMap[f.key] = f.name.trim()
  })
  localStorage.setItem('communicateiq_stakeholders', JSON.stringify(stakeholderMap))
} catch {}    
setLoading(true)
    setActiveTab('review')

    const formalSummary = formal.filter(f => f.name).map(f =>
      `${f.role}: ${f.name}, Relationship ${f.relationship}/5, Last contact: ${f.lastContact || 'unknown'}`
    ).join('\n')

    const informalSummary = informal.filter(c => c.name).map(c =>
      `${c.name} (${c.title}): Cares about "${c.cares}". Influence mechanism: "${c.influence}". Relationship ${c.relationship}/5`
    ).join('\n')

    const system = `You are a master facilitator for CommunicateIQ's Executive Communication Training Program reviewing a GM's stakeholder map.
Your job is to identify gaps, blind spots, and risks — and give specific, actionable coaching. Be direct.
Format with these exact headers:
## Strengths in This Map
## Critical Gaps
## Informal Influence Analysis
## Highest Risk Relationships
## Three Actions for the Next 14 Days
Keep total response under 400 words. Be specific to what they submitted, not generic.`

    const prompt = `Account: ${account || 'Not specified'}

FORMAL STAKEHOLDERS:
${formalSummary || 'None entered'}

INFORMAL / NON-TITLED INFLUENCERS:
${informalSummary || 'None entered'}

HIGHEST RISK RELATIONSHIP IDENTIFIED BY GM: ${riskRelationship || 'Not specified'}
PLANNED ACTION: ${riskAction || 'Not specified'}

Review this stakeholder map and provide coaching feedback.`

    try {
      const result = await callAI({ system, messages: [{ role: 'user', content: prompt }], max_tokens: 700 })
      setReview(result)
    } catch (e) {
      setReview('Unable to generate review. Please check your connection.')
    }
    setLoading(false)
  }

  const relColor = (r) => {
    const n = parseInt(r)
    return n <= 2 ? C.red : n === 3 ? '#b87333' : C.green
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>Day 1 · Stakeholder Mapping</span>
        </div>

        <div className="fade-up">
          <span className="label">Day 1 · Stakeholder Mastery</span>
          <h1 className="section-title">Build Your Account Map</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
            The most dangerous assumption in this business is that the people who matter are the people on your meeting calendar.
            Map formal contacts AND at least <strong style={{ color: '#1C2B5E' }}>three non-titled informal influencers</strong>.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#EAECF0', borderRadius: 8, padding: 4, width: 'fit-content' }}>
          {[['map','📋 Build Map'],['review','🤖 AI Review']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? C.gold : 'transparent',
              color: activeTab === tab ? C.navy : C.gray,
              fontWeight: activeTab === tab ? 700 : 400, fontSize: 13, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {activeTab === 'map' && (
          <>
            {/* Account */}
            <div className="card fade-up-1" style={{ marginBottom: 16 }}>
              <span className="label">{cfg.accountLabel}</span>
              <input value={account} onChange={e => setAccount(e.target.value)}
                placeholder={cfg.accountPlaceholder}
                style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '10px 14px', color: '#1C2B5E', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt}
              />
            </div>

            {/* Formal stakeholders */}
            <div className="card fade-up-2" style={{ marginBottom: 16 }}>
              <span className="label">Formal Stakeholders</span>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr 80px 130px', gap: 8, alignItems: 'center', marginBottom: 4, paddingBottom: 8, borderBottom: `1px solid ${C.navyLt}` }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Role</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Contact Name</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Last Contact</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Rel. Strength</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>What They Care About</div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {formal.map((f, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr 80px 130px', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#1C2B5E', fontWeight: 600 }}>{f.role}</div>
                    <input placeholder="Contact name" value={f.name} onChange={e => updateFormal(i, 'name', e.target.value)}
                      style={{ background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '7px 10px', color: '#1C2B5E', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                    <input placeholder="Last contact date" value={f.lastContact} onChange={e => updateFormal(i, 'lastContact', e.target.value)}
                      style={{ background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '7px 10px', color: '#1C2B5E', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                    <div style={{ textAlign: 'center' }}>
                      <select value={f.relationship} onChange={e => updateFormal(i, 'relationship', e.target.value)}
                        style={{ background: '#EAECF0', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '5px', color: relColor(f.relationship), fontSize: 13, fontWeight: 700, width: '100%', outline: 'none' }}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{f.cares}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informal influencers */}
            <div className="card fade-up-3" style={{ marginBottom: 16, border: '1.5px solid #1C2B5E' }}>
              <span className="label">Non-Titled Informal Influencers <span style={{ color: '#1C2B5E' }}>(minimum 3 required)</span></span>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
                Who shapes decisions without appearing in a meeting? Long-tenured admins, faculty senate leaders, trusted advisors, student influencers, head coaches?
              </p>
              {informal.map((inf, i) => (
                <div key={i} style={{ background: '#F4F6F9', borderRadius: 8, padding: 14, marginBottom: 10, border: '1.5px solid #D1D5DB' }}>
                  <div style={{ fontSize: 11, color: '#1C2B5E', fontWeight: 700, marginBottom: 8 }}>Influencer {i + 1}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input placeholder="Name" value={inf.name} onChange={e => updateInformal(i, 'name', e.target.value)}
                      style={{ background: '#EAECF0', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '8px 10px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                    <input placeholder="Informal title / role" value={inf.title} onChange={e => updateInformal(i, 'title', e.target.value)}
                      style={{ background: '#EAECF0', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '8px 10px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <input placeholder="What do they care about most?" value={inf.cares} onChange={e => updateInformal(i, 'cares', e.target.value)}
                    style={{ width: '100%', background: '#EAECF0', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '8px 10px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
                  <textarea placeholder="How do they actually influence decisions? Who do they talk to? How did you discover this?" value={inf.influence} onChange={e => updateInformal(i, 'influence', e.target.value)}
                    rows={2} style={{ width: '100%', background: '#EAECF0', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '8px 10px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Relationship strength:</span>
                    <select value={inf.relationship} onChange={e => updateInformal(i, 'relationship', e.target.value)}
                      style={{ background: '#EAECF0', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '4px 8px', color: relColor(inf.relationship), fontSize: 13, fontWeight: 700, outline: 'none' }}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={addInformal} className="btn-ghost" style={{ fontSize: 12, marginTop: 4 }}>+ Add Another Influencer</button>
            </div>

            {/* Risk assessment */}
            <div className="card fade-up-4" style={{ marginBottom: 24 }}>
              <span className="label">Risk Assessment</span>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Which relationship is most at risk right now, and why?</div>
                <textarea value={riskRelationship} onChange={e => setRiskRelationship(e.target.value)} rows={2}
                  style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '10px 12px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>What specific action will you take in the next 14 days?</div>
                <textarea value={riskAction} onChange={e => setRiskAction(e.target.value)} rows={2}
                  style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '10px 12px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: filledInformal.length >= 3 ? C.greenLt : C.red, alignSelf: 'center' }}>
                {filledInformal.length}/3 informal influencers required {filledInformal.length >= 3 ? '✓' : ''}
              </div>
              <button className="btn-primary" onClick={getAIReview} disabled={!canReview || loading}>
                Get AI Coaching Review →
              </button>
            </div>
          </>
        )}

        {activeTab === 'review' && (
          <div className="fade-up">
            {loading ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                  {[0,1,2].map(n => <div key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />)}
                </div>
                <div style={{ color: '#6B7280', fontSize: 14 }}>Analyzing your stakeholder map...</div>
              </div>
            ) : review ? (
              <>
                <div className="card" style={{ marginBottom: 16, borderColor: '#1C2B5E' }}>
                  <span className="label">AI Facilitator Review — Stakeholder Map</span>
                  <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
                    {review.split('\n').map((line, i) => (
                      <div key={i} style={{
                        fontWeight: line.startsWith('##') ? 700 : 400,
                        color: line.startsWith('##') ? C.gold : C.offWhite,
                        marginBottom: line.startsWith('##') ? 6 : 3,
                        fontSize: line.startsWith('##') ? 11 : 14,
                        letterSpacing: line.startsWith('##') ? 1.5 : 0,
                        textTransform: line.startsWith('##') ? 'uppercase' : 'none',
                        marginTop: line.startsWith('##') ? 14 : 0,
                      }}>{line.replace(/^##\s*/, '')}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <button className="btn-ghost" onClick={() => setActiveTab('map')}>← Edit Map</button>
                  <Link href="/simulation" className="btn-primary">Continue: Role-Play Simulations →</Link>
                </div>
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ color: '#6B7280', marginBottom: 16 }}>Complete your stakeholder map first, then get the AI review.</div>
                <button className="btn-ghost" onClick={() => setActiveTab('map')}>← Go to Map</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
