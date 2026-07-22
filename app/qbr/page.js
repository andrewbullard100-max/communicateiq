'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { C, callAI, getSelectedIndustryId, getIndustryConfig } from '../../lib/data'

const SILENCE_MS = 5000

export default function QBRPage() {
  const [industryId, setIndustryId] = useState('higher-ed')
  useEffect(() => { setIndustryId(getSelectedIndustryId()) }, [])
  const cfg = getIndustryConfig(industryId)
  const QBR_SECTIONS = cfg.qbrSections
  const BOARDROOM_PERSONAS = cfg.qbrPersonas

  const [account, setAccount] = useState('')
  const [period, setPeriod] = useState('')
  const [sections, setSections] = useState(() => Object.fromEntries(QBR_SECTIONS.map(s => [s.id, s.defaultValue || ''])))
  const [step, setStep] = useState('build')
  const [selectedPersona, setSelectedPersona] = useState(BOARDROOM_PERSONAS[0])
  // Re-seed section defaults and the selected persona once the real
  // industry resolves post-mount (initial render uses higher-ed).
  useEffect(() => {
    setSections(Object.fromEntries(QBR_SECTIONS.map(s => [s.id, s.defaultValue || ''])))
    setSelectedPersona(BOARDROOM_PERSONAS[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryId])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [structureReview, setStructureReview] = useState('')
  const [deliveryResult, setDeliveryResult] = useState(null)
  const [exchanges, setExchanges] = useState(0)
  const [listening, setListening] = useState(false)
  const [micStatus, setMicStatus] = useState('')
  const audioRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const silenceCheckRef = useRef(null)
  const audioCtxRef = useRef(null)

  // Stop all audio when navigating away
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (silenceCheckRef.current) cancelAnimationFrame(silenceCheckRef.current)
      if (audioCtxRef.current) { try { audioCtxRef.current.close() } catch {} audioCtxRef.current = null }
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }
  }, [])

  // ── SPEECH OUTPUT ─────────────────────────────────────────────────────────

  async function speakText(text, autoMic = false) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        audioRef.current = null
        URL.revokeObjectURL(url)
        if (autoMic) startRecording()
      }
      audio.onerror = () => { audioRef.current = null }
      await audio.play()
    } catch {}
  }

  // ── WHISPER + SILENCE DETECTION ───────────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      setListening(true)
      setMicStatus('recording')

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (silenceCheckRef.current) cancelAnimationFrame(silenceCheckRef.current)
        if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
        setListening(false)
        setMicStatus('transcribing')

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size < 1000) { setMicStatus(''); return }

        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const { text } = await res.json()
          setMicStatus('')
          if (text?.trim()) await handleUserSpeech(text.trim())
        } catch {
          setMicStatus('')
        }
      }

      mediaRecorder.start()

      // Silence detection — stops after SILENCE_MS of quiet
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      let silenceStart = null

      function checkSilence() {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        if (avg < 8) {
          if (!silenceStart) silenceStart = Date.now()
          else if (Date.now() - silenceStart > SILENCE_MS) {
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
            return
          }
        } else {
          silenceStart = null
        }
        silenceCheckRef.current = requestAnimationFrame(checkSilence)
      }
      silenceCheckRef.current = requestAnimationFrame(checkSilence)

      // Safety max 60s
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      }, 60000)

    } catch (err) {
      setListening(false)
      setMicStatus('')
    }
  }

  function stopRecording() {
    if (silenceCheckRef.current) cancelAnimationFrame(silenceCheckRef.current)
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  async function handleUserSpeech(transcript) {
    const newMsgs = [...messages, { role: 'user', content: transcript }]
    setMessages(newMsgs)
    setExchanges(c => c + 1)
    setLoading(true)
    try {
      const text = await callAI({ system: buildDeliverySystem(), messages: newMsgs })
      const marker = 'DELIVERY_COMPLETE'
      if (text.includes(marker)) {
        try {
          const clean = text.slice(text.indexOf(marker) + marker.length).trim().replace(/```json|```/g, '').trim()
          setDeliveryResult(JSON.parse(clean))
          setStep('results')
        } catch { setMessages(prev => [...prev, { role: 'assistant', content: text }]) }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: text }])
        await speakText(text, true)
      }
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.' }]) }
    setLoading(false)
  }

  // ── QBR LOGIC ─────────────────────────────────────────────────────────────

  function updateSection(id, val) { setSections(s => ({ ...s, [id]: val })) }
  const completedSections = QBR_SECTIONS.filter(s => sections[s.id]?.trim().length > 20).length
  const canReview = completedSections >= 3

  async function getStructureReview() {
    setLoading(true)
    setStep('review')
    const content = QBR_SECTIONS.map(s => `## ${s.label}\n${sections[s.id] || '(not completed)'}`).join('\n\n')
    const system = `You are a master facilitator reviewing a foodservice GM's QBR structure before they present to a client executive board.
Evaluate the QBR for: executive framing (does it lead with decisions or with history?), financial storytelling quality, the client-experience narrative, strategic forward-focus, and decision clarity.
Format with these headers:
## Overall Structure Assessment
## Section-by-Section Feedback  
## What Will Land Well with This Board
## What Needs Sharpening Before You Present
## One Structural Change That Would Elevate This
Keep total under 400 words. Be specific.`
    try {
      const result = await callAI({
        system,
        messages: [{ role: 'user', content: `Account: ${account || 'Not specified'}\nPeriod: ${period || 'Not specified'}\n\nQBR CONTENT:\n${content}` }],
        max_tokens: 700,
      })
      setStructureReview(result)
    } catch { setStructureReview('Connection error. Please try again.') }
    setLoading(false)
  }

  function buildDeliverySystem() {
    const qbrContent = QBR_SECTIONS.map(s => `${s.label}: ${sections[s.id] || '(not completed)'}`).join('\n')
    return `You are playing the role of ${selectedPersona.label} in a QBR presentation for ${account || 'a foodservice client account'}.

PERSONA: ${selectedPersona.style}

The GM is presenting their QBR to you. Engage authentically as this executive. Ask the hard questions your role would ask. Do not accept vague answers — push for specifics. Keep responses to 2-4 sentences — this is a voice conversation.

QBR CONTENT (what the GM built):
${qbrContent}

When you receive [END QBR], evaluate the delivery and output:

DELIVERY_COMPLETE
{
  "executivePresence": <1-4>,
  "dataCommand": <1-4>,
  "strategicFraming": <1-4>,
  "questionHandling": <1-4>,
  "decisionClarity": <1-4>,
  "headline": "<one sentence on overall delivery quality>",
  "strongestMoment": "<specific thing they did well>",
  "criticalGap": "<specific thing that fell flat>",
  "boardReadiness": "<Board Ready | Needs Rehearsal | Significant Development Required>"
}

Scoring: 1=Weak, 2=Developing, 3=Proficient, 4=Distinguished`
  }

  async function beginDelivery() {
    // Unlock autoplay
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        await ctx.resume()
        const buf = ctx.createBuffer(1, 1, 22050)
        const src = ctx.createBufferSource()
        src.buffer = buf
        src.connect(ctx.destination)
        src.start(0)
      }
      const warmRes = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'ready' }),
      })
      if (warmRes.ok) {
        const warmBlob = await warmRes.blob()
        const warmUrl = URL.createObjectURL(warmBlob)
        const warmAudio = new Audio(warmUrl)
        warmAudio.volume = 0
        await warmAudio.play().catch(() => {})
        warmAudio.pause()
        URL.revokeObjectURL(warmUrl)
      }
    } catch {}

    setStep('delivery')
    setMessages([])
    setDeliveryResult(null)
    setExchanges(0)
    setLoading(true)
    try {
      const text = await callAI({
        system: buildDeliverySystem(),
        messages: [{ role: 'user', content: '[BEGIN QBR — the GM is now presenting. Open with a brief welcome as this executive, then let them present]' }],
      })
      setMessages([{ role: 'assistant', content: text }])
      await speakText(text, true)
    } catch { setMessages([{ role: 'assistant', content: 'Connection error. Please try again.' }]) }
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMsgs = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMsgs)
    setExchanges(c => c + 1)
    setLoading(true)
    try {
      const text = await callAI({ system: buildDeliverySystem(), messages: newMsgs })
      const marker = 'DELIVERY_COMPLETE'
      if (text.includes(marker)) {
        try {
          const clean = text.slice(text.indexOf(marker) + marker.length).trim().replace(/```json|```/g, '').trim()
          setDeliveryResult(JSON.parse(clean))
          setStep('results')
        } catch { setMessages(prev => [...prev, { role: 'assistant', content: text }]) }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: text }])
        await speakText(text, true)
      }
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.' }]) }
    setLoading(false)
  }

  async function endDelivery() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    stopRecording()
    setLoading(true)
    try {
      const apiMsgs = [...messages, {
        role: 'user',
        content: '[END QBR] Output DELIVERY_COMPLETE followed immediately by the JSON scoring block. Do not speak as the character. Do not add any text before or after the JSON.'
      }]
      const text = await callAI({ system: buildDeliverySystem(), messages: apiMsgs, max_tokens: 800 })
      const marker = 'DELIVERY_COMPLETE'
      if (text.includes(marker)) {
        try {
          const clean = text.slice(text.indexOf(marker) + marker.length).trim().replace(/```json|```/g, '').trim()
          setDeliveryResult(JSON.parse(clean))
          setStep('results')
        } catch {}
      } else {
        const retry = await callAI({
          system: buildDeliverySystem() + '\n\nCRITICAL: You MUST output DELIVERY_COMPLETE followed by valid JSON now. Nothing else.',
          messages: [...apiMsgs, { role: 'assistant', content: text }, { role: 'user', content: 'Output the DELIVERY_COMPLETE JSON scoring block now.' }],
          max_tokens: 800
        })
        if (retry.includes(marker)) {
          try {
            const clean = retry.slice(retry.indexOf(marker) + marker.length).trim().replace(/```json|```/g, '').trim()
            setDeliveryResult(JSON.parse(clean))
            setStep('results')
          } catch {}
        }
      }
    } catch {}
    setLoading(false)
  }

  const scoreColor = (v) => v <= 1 ? C.red : v === 2 ? '#b87333' : v === 3 ? '#2a6b4a' : C.green
  const scoreLabel = (v) => ['','Weak','Developing','Proficient','Distinguished'][v] || '—'

  // ── BUILD SCREEN ──────────────────────────────────────────────────────────
  if (step === 'build') return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>Day 4 · QBR Builder & Delivery</span>
        </div>
        <span className="label">Day 4 · QBR Excellence</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 8 }}>Build Your QBR</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          A QBR that drives strategic decisions looks fundamentally different from one that reports history.
          Build your structure here, get AI coaching on the framing, then deliver it live to an AI boardroom executive.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[[cfg.accountLabel, account, setAccount, cfg.accountPlaceholder],['Reporting Period', period, setPeriod, 'e.g. Q2 FY2026']].map(([label, val, set, ph]) => (
            <div key={label} className="card">
              <span className="label">{label}</span>
              <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '10px 14px', color: '#1C2B5E', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
            </div>
          ))}
        </div>
        {QBR_SECTIONS.map((s, i) => (
          <div key={s.id} className={`card fade-up-${Math.min(i+1,5)}`} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span className="label" style={{ marginBottom: 2 }}>Section {i+1} of {QBR_SECTIONS.length}</span>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1C2B5E' }}>{s.label}</div>
              </div>
              {sections[s.id]?.trim().length > 20 && <span style={{ fontSize: 11, color: C.greenLt }}>✓ Complete</span>}
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>{s.desc}</p>
            <textarea value={sections[s.id] || ''} onChange={e => updateSection(s.id, e.target.value)} rows={4}
              style={{ width: '100%', background: '#F4F6F9', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '12px 14px', color: '#1C2B5E', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.navyLt} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: completedSections >= 3 ? C.greenLt : C.gray }}>{completedSections}/5 sections complete {completedSections >= 3 ? '— ready for review' : '— complete at least 3 to continue'}</span>
          <button className="btn-primary" onClick={getStructureReview} disabled={!canReview || loading}>Get AI Structure Review →</button>
        </div>
      </div>
    </div>
  )

  // ── REVIEW SCREEN ──────────────────────────────────────────────────────────
  if (step === 'review') return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }}>
        <button className="btn-ghost" style={{ marginBottom: 24 }} onClick={() => setStep('build')}>← Edit QBR</button>
        <span className="label">AI Structure Review</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 20 }}>QBR Coaching Feedback</h1>
        <div className="card fade-up-1" style={{ marginBottom: 20, borderColor: '#1C2B5E' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
                {[0,1,2].map(n => <div key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />)}
              </div>
              <div style={{ color: '#6B7280' }}>Reviewing your QBR structure...</div>
            </div>
          ) : (
            <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
              {structureReview.split('\n').map((line, i) => (
                <div key={i} style={{ fontWeight: line.startsWith('##') ? 700 : 400, color: line.startsWith('##') ? C.gold : C.offWhite, fontSize: line.startsWith('##') ? 11 : 14, letterSpacing: line.startsWith('##') ? 1.5 : 0, textTransform: line.startsWith('##') ? 'uppercase' : 'none', marginTop: line.startsWith('##') ? 16 : 0, marginBottom: line.startsWith('##') ? 6 : 3 }}>
                  {line.replace(/^##\s*/, '')}
                </div>
              ))}
            </div>
          )}
        </div>
        {!loading && (
          <>
            <div className="card fade-up-2" style={{ marginBottom: 20 }}>
              <span className="label">Choose Your Boardroom Executive</span>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Who are you presenting to? The AI will adopt this persona and ask the questions they would actually ask.</p>
              {BOARDROOM_PERSONAS.map(p => (
                <div key={p.id} onClick={() => setSelectedPersona(p)} style={{
                  padding: '12px 16px', borderRadius: 8, border: `1px solid ${selectedPersona.id === p.id ? C.gold : C.navyLt}`,
                  background: selectedPersona.id === p.id ? 'rgba(28,43,94,0.06)' : 'transparent',
                  cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: selectedPersona.id === p.id ? C.white : C.offWhite }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{p.style}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => window.open('/reference-sheets.html?sheet=qbr', '_blank')}
              >
                🖨️ Print QBR Reference Sheet
              </button>
              <button className="btn-primary" onClick={beginDelivery}>Begin Live QBR Delivery →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── DELIVERY SCREEN ────────────────────────────────────────────────────────
  if (step === 'delivery') return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes wave{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}
        @keyframes ripple{0%{box-shadow:0 0 0 0 rgba(74,174,74,0.5)}70%{box-shadow:0 0 0 16px rgba(74,174,74,0)}100%{box-shadow:0 0 0 0 rgba(74,174,74,0)}}
      `}</style>

      {/* Header */}
      <div style={{ background: '#F4F6F9', borderBottom: `1px solid ${C.navyLt}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => { stopRecording(); setStep('review') }}>← Exit</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>LIVE QBR DELIVERY · DAY 4</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{account || 'QBR'} — Presenting to {selectedPersona.label}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20,
          background: loading && micStatus === '' ? 'rgba(106,176,245,0.1)' : micStatus === 'recording' ? 'rgba(74,174,74,0.1)' : 'rgba(107,114,128,0.08)',
          border: `1px solid ${loading && micStatus === '' ? '#6ab0f580' : micStatus === 'recording' ? '#4aae4a80' : '#6B728040'}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: loading && micStatus === '' ? '#6ab0f5' : micStatus === 'recording' ? '#4aae4a' : '#9CA3AF',
            animation: (loading || micStatus === 'recording') ? 'pulse 1s infinite' : 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: loading && micStatus === '' ? '#6ab0f5' : micStatus === 'recording' ? '#4aae4a' : '#9CA3AF' }}>
            {loading && micStatus === '' ? 'AI Speaking' : micStatus === 'recording' ? 'Listening...' : micStatus === 'transcribing' ? 'Transcribing...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 780, width: '100%', margin: '0 auto' }}>

        {micStatus === 'recording' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4aae4a', animation: 'ripple 1.2s infinite' }} />
            <span style={{ fontSize: 13, color: '#4aae4a', fontWeight: 600 }}>Listening — speak now, pause when done</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: msg.role === 'user' ? C.gold : C.navyLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {msg.role === 'user' ? '👤' : selectedPersona.icon}
            </div>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '12px 16px', maxWidth: '80%', borderTopRightRadius: msg.role === 'user' ? 2 : 10, borderTopLeftRadius: msg.role === 'assistant' ? 2 : 10 }}>
              <div style={{ fontSize: 10, color: msg.role === 'assistant' ? C.gold : C.grayLt, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                {msg.role === 'assistant' ? selectedPersona.label.toUpperCase() : 'YOU — GM / PRESENTER'}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          </div>
        ))}

        {(loading || micStatus === 'transcribing') && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.navyLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {micStatus === 'transcribing' ? '🎤' : selectedPersona.icon}
            </div>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderRadius: 10, borderTopLeftRadius: 2, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{micStatus === 'transcribing' ? 'Transcribing...' : 'Thinking...'}</div>
              <div style={{ display: 'flex', gap: 5 }}>{[0,1,2].map(n => <div key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#F4F6F9', borderTop: `1px solid ${C.navyLt}`, padding: '16px 20px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              rows={3}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={
                micStatus === 'recording' ? '🟢 Listening — pause when done speaking' :
                micStatus === 'transcribing' ? 'Transcribing...' :
                'Or type your response here (Enter to send)'
              }
              disabled={loading || micStatus !== ''}
              style={{
                flex: 1, background: '#F4F6F9', color: '#1C2B5E',
                border: `1.5px solid ${micStatus === 'recording' ? '#4aae4a' : '#D1D5DB'}`,
                borderRadius: 8, padding: '12px 14px', fontSize: 14,
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { if (!micStatus) e.target.style.borderColor = C.gold }}
              onBlur={e => { if (!micStatus) e.target.style.borderColor = C.navyLt }}
            />
            <button className="btn-primary" onClick={sendMessage} disabled={loading || !input.trim() || micStatus !== ''}>Send</button>
            <button onClick={endDelivery} disabled={loading || messages.length < 2}
              style={{ background: 'transparent', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: messages.length < 2 ? '#9CA3AF' : '#1C2B5E', cursor: messages.length < 2 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              End & Score
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
            {micStatus === 'recording' ? `Mic open — ${SILENCE_MS/1000}s pause will send automatically` : 'Mic opens after AI speaks · or type above'}
          </div>
        </div>
      </div>
    </div>
  )

  // ── RESULTS SCREEN ─────────────────────────────────────────────────────────
  if (step === 'results' && deliveryResult) {
    const dims = [
      { id: 'executivePresence', label: 'Executive Presence' },
      { id: 'dataCommand',       label: 'Data Command' },
      { id: 'strategicFraming',  label: 'Strategic Framing' },
      { id: 'questionHandling',  label: 'Question Handling' },
      { id: 'decisionClarity',   label: 'Decision Clarity' },
    ]
    const total = dims.reduce((sum, d) => sum + (deliveryResult[d.id] || 0), 0)
    const statusColor = deliveryResult.boardReadiness === 'Board Ready' ? C.green : deliveryResult.boardReadiness === 'Needs Rehearsal' ? '#b87333' : C.red
    return (
      <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }}>
          <span className="label fade-up">Day 4 · QBR Delivery Assessment</span>
          <h1 className="section-title fade-up" style={{ marginBottom: 24 }}>QBR Delivery Results</h1>
          <div className="card fade-up-1" style={{ border: '2px solid #1C2B5E', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="label">AI Board Assessment</span>
                <div style={{ fontSize: 16, fontWeight: 600, maxWidth: 480 }}>{deliveryResult.headline}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'monospace', color: total >= 16 ? C.green : total >= 12 ? '#b87333' : C.red }}>{total}/20</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Delivery Score</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {dims.map(d => {
                const v = deliveryResult[d.id] || 0
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 160, fontSize: 12, fontWeight: 600 }}>{d.label}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4].map(n => <div key={n} style={{ width: 28, height: 10, borderRadius: 3, background: n <= v ? scoreColor(v) : C.navyLt }} />)}
                    </div>
                    <span style={{ fontSize: 11, color: scoreColor(v), fontWeight: 700, fontFamily: 'monospace', marginLeft: 6 }}>{scoreLabel(v)}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ background: 'rgba(55,86,35,0.15)', border: `1px solid ${C.green}`, borderRadius: 8, padding: 14 }}>
                <div style={{ color: C.greenLt, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Strongest Moment</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{deliveryResult.strongestMoment}</div>
              </div>
              <div style={{ background: 'rgba(192,0,0,0.1)', border: `1px solid ${C.red}`, borderRadius: 8, padding: 14 }}>
                <div style={{ color: '#e05555', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Critical Gap</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{deliveryResult.criticalGap}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${statusColor}22`, border: `1px solid ${statusColor}`, borderRadius: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor }} />
              <div style={{ color: statusColor, fontWeight: 700, fontSize: 13 }}>{deliveryResult.boardReadiness}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => { setStep('delivery'); beginDelivery() }}>Retry Delivery</button>
            <Link href="/dashboard" className="btn-primary">View Certification Dashboard →</Link>
          </div>
        </div>
      </div>
    )
  }
  return null
}
