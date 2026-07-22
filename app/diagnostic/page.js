'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { C, callAI, getSelectedIndustryId, getIndustryConfig } from '../../lib/data'

export default function DiagnosticPage() {
  const [industryId, setIndustryId] = useState('higher-ed')
  useEffect(() => { setIndustryId(getSelectedIndustryId()) }, [])
  const cfg = getIndustryConfig(industryId)
  const DIAGNOSTIC_QUESTIONS = cfg.diagnosticQuestions

  const [scores, setScores] = useState({})
  const [avoidedConversation, setAvoidedConversation] = useState('')
  const [account, setAccount] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')

  const allAnswered = DIAGNOSTIC_QUESTIONS.every(q => scores[q.id]) && avoidedConversation.trim()

  async function handleSubmit() {
    setLoading(true)
    setSubmitted(true)
    const scoreList = DIAGNOSTIC_QUESTIONS.map(q => `${q.label}: ${scores[q.id]}/5`).join('\n')
    const system = `You are a master facilitator for CommunicateIQ's Executive Communication Training Program. 
You have just received a participant's pre-course diagnostic results. Your job is to provide a 
personalized, specific learning plan — not generic encouragement. Be direct, specific, and practical.
Format your response with clear sections using these exact headers:
## Your Priority Development Areas
## Your Strengths to Build On  
## What This Week Will Focus On For You
## The Conversation You're Avoiding — Let's Address It
Keep total response under 350 words. Use plain language, no jargon.`

    const prompt = `Participant account: ${account || 'Not specified'}
    
Self-assessment scores (1=low confidence, 5=high confidence):
${scoreList}

Avoided conversation they identified: "${avoidedConversation}"

Provide a personalized learning plan based on these results.`

    try {
      const result = await callAI({
        system,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
      })
      setAnalysis(result)
    } catch (e) {
      setAnalysis('Unable to generate analysis. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const priorityAreas = DIAGNOSTIC_QUESTIONS
    .filter(q => scores[q.id] && parseInt(scores[q.id]) <= 3)
    .sort((a, b) => parseInt(scores[a.id]) - parseInt(scores[b.id]))
    .slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '36px 24px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>Pre-Course Diagnostic</span>
        </div>

        {!submitted ? (
          <>
            <div className="fade-up">
              <span className="label">Start Here · Pre-Course Diagnostic</span>
              <h1 className="section-title">Know Your Starting Point</h1>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
                Rate yourself honestly — 1 (low confidence) to 5 (high confidence). There are no wrong answers.
                The AI uses this to personalize your learning path, not to evaluate you.
              </p>
            </div>

            {/* Account field */}
            <div className="card fade-up-1" style={{ marginBottom: 16 }}>
              <span className="label">Your Account / Location</span>
              <input
                value={account}
                onChange={e => setAccount(e.target.value)}
                placeholder={cfg.accountPlaceholder}
                style={{
                  width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB',
                  borderRadius: 6, padding: '10px 14px', color: '#1C2B5E',
                  fontSize: 14, fontFamily: 'inherit', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.navyLt}
              />
            </div>

            {/* Rating questions */}
            <div className="card fade-up-2" style={{ marginBottom: 16 }}>
              <span className="label">Confidence Self-Assessment</span>
              <div style={{ display: 'grid', gap: 16 }}>
                {DIAGNOSTIC_QUESTIONS.map(q => (
                  <div key={q.id}>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, lineHeight: 1.5 }}>{q.label}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5].map(n => {
                        const selected = scores[q.id] === String(n)
                        const color = n <= 2 ? C.red : n === 3 ? '#b87333' : C.green
                        return (
                          <button
                            key={n}
                            onClick={() => setScores(s => ({ ...s, [q.id]: String(n) }))}
                            style={{
                              width: 40, height: 40, borderRadius: 6,
                              border: `1px solid ${selected ? color : C.navyLt}`,
                              background: selected ? `${color}22` : 'transparent',
                              color: selected ? color : C.gray,
                              fontWeight: selected ? 700 : 400,
                              cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
                            }}
                          >{n}</button>
                        )
                      })}
                      {[['1','Low'],['3','Moderate'],['5','High']].map(([val, lbl]) => (
                        scores[q.id] === val && <span key={lbl} style={{ fontSize: 11, color: '#6B7280', alignSelf: 'center' }}>{lbl} confidence</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoided conversation */}
            <div className="card fade-up-3" style={{ marginBottom: 24 }}>
              <span className="label">The Conversation You've Been Avoiding</span>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                What is the one client conversation you have been putting off? Be specific — name the person, the issue, and what makes it hard.
              </p>
              <textarea
                value={avoidedConversation}
                onChange={e => setAvoidedConversation(e.target.value)}
                placeholder={`e.g. I need to tell the ${cfg.decisionMakerTitle} that our food cost will exceed budget this quarter because of protein costs, but I haven't found the right framing yet...`}
                rows={4}
                style={{
                  width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB',
                  borderRadius: 6, padding: '12px 14px', color: '#1C2B5E',
                  fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.navyLt}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleSubmit} disabled={!allAnswered}>
                Get My Personalized Learning Plan →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="fade-up">
              <span className="label">Your Diagnostic Results</span>
              <h1 className="section-title" style={{ marginBottom: 24 }}>Personalized Learning Plan</h1>
            </div>

            {/* Score summary */}
            <div className="card fade-up-1" style={{ marginBottom: 16 }}>
              <span className="label">Confidence Profile</span>
              <div style={{ display: 'grid', gap: 10 }}>
                {DIAGNOSTIC_QUESTIONS.map(q => {
                  const score = parseInt(scores[q.id] || 0)
                  const color = score <= 2 ? C.red : score === 3 ? '#b87333' : C.green
                  return (
                    <div key={q.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ flex: 1, fontSize: 12, color: '#374151' }}>{q.label}</div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1,2,3,4,5].map(n => (
                          <div key={n} style={{
                            width: 20, height: 8, borderRadius: 2,
                            background: n <= score ? color : C.navyLt,
                            transition: 'background 0.3s',
                          }} />
                        ))}
                      </div>
                      <div style={{ width: 20, textAlign: 'right', fontSize: 12, color, fontWeight: 700 }}>{score}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Priority areas */}
            {priorityAreas.length > 0 && (
              <div style={{
                background: `rgba(192,0,0,0.08)`, border: `1px solid ${C.red}`,
                borderRadius: 10, padding: 16, marginBottom: 16,
              }}>
                <span className="label" style={{ color: '#e05555' }}>Priority Development Areas</span>
                {priorityAreas.map(q => (
                  <div key={q.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                    <span style={{ color: '#e05555' }}>△</span>{q.label} (score: {scores[q.id]}/5)
                  </div>
                ))}
              </div>
            )}

            {/* AI Analysis */}
            <div className="card fade-up-2" style={{ marginBottom: 24 }}>
              <span className="label">AI Facilitator Analysis</span>
              {loading ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '20px 0' }}>
                  {[0,1,2].map(n => (
                    <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />
                  ))}
                  <span style={{ color: '#6B7280', fontSize: 13, marginLeft: 6 }}>Analyzing your results...</span>
                </div>
              ) : (
                <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {analysis.split('\n').map((line, i) => (
                    <div key={i} style={{
                      fontWeight: line.startsWith('##') ? 700 : 400,
                      color: line.startsWith('##') ? C.gold : C.offWhite,
                      marginBottom: line.startsWith('##') ? 4 : 2,
                      fontSize: line.startsWith('##') ? 12 : 14,
                      letterSpacing: line.startsWith('##') ? 1 : 0,
                      textTransform: line.startsWith('##') ? 'uppercase' : 'none',
                    }}>
                      {line.replace(/^##\s*/, '')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button className="btn-ghost" onClick={() => { setSubmitted(false); setAnalysis('') }}>Retake Diagnostic</button>
              <Link href="/stakeholder" className="btn-primary">Continue: Stakeholder Mapping →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
