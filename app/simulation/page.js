'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { C, SCENARIOS, DIMENSIONS, LEVEL_LABELS, LEVEL_COLORS, INDUSTRIES, TRAINING_TYPES, callAI } from '../../lib/data'

const SILENCE_MS = 3500 // stop recording after 3.5s of silence (kitchen-environment tuned)

function buildSystemPrompt(scenario) {
  return `You are an AI-powered executive communication training evaluator for CommunicateIQ Executive Communication Training.

You play TWO roles simultaneously:

ROLE 1 — CLIENT CHARACTER
${scenario.clientPersona}

Start with this OPENING LINE: "${scenario.openingLine}"

Stay fully in character. Push back when answers are vague. Ask follow-up questions real executives ask. Do NOT break character. Keep responses to 2-4 sentences — this is a voice conversation.

ROLE 2 — EVALUATOR (only when simulation ends)
When you receive [END SIMULATION], output EXACTLY this structure:

SIMULATION_COMPLETE
{
  "scores": { "clarity": <1-4>, "data": <1-4>, "ownership": <1-4>, "tone": <1-4>, "commitment": <1-4> },
  "headline": "<one sentence verdict>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "gaps": ["<specific gap 1>", "<specific gap 2>"],
  "distinguishedExample": "<one specific thing they could have said to reach Distinguished level>",
  "certificationStatus": "<Certified — Client Ready | Conditional — Field Coaching Required | Not Yet Certified — Development Required>"
}

RUBRIC: 1=Weak 2=Developing 3=Proficient 4=Distinguished

CRITICAL CONTRACTOR BOUNDARIES:
The trainee is a third-party contracted service provider operating inside someone else's institution (a university, health system, senior living community, employer, or school district). They CANNOT unilaterally overrule that institution's staff, clinical decisions, or policies. They CAN document issues, create written protocols, escalate internally through their own company, and build a paper trail. The specific boundaries for this scenario are detailed in the CLIENT CHARACTER persona above — follow those exactly.

SCENARIO: ${scenario.context}
SUCCESS CRITERIA:
${scenario.successCriteria.map((c, i) => `${i+1}. ${c}`).join('\n')}
${scenario.dataPacket ? `\nDATA PACKET:\n${scenario.dataPacket.headers.join(' | ')}\n${scenario.dataPacket.rows.map(r => r.join(' | ')).join('\n')}` : ''}`
}

function parseScoringResult(text) {
  const marker = 'SIMULATION_COMPLETE'
  const idx = text.indexOf(marker)
  if (idx === -1) return null
  try {
    const clean = text.slice(idx + marker.length).trim().replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch { return null }
}

function persistResult(scenario, scored) {
  if (!scenario || !scored?.scores) return
  fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      industry: scenario.industry,
      trainingType: scenario.trainingType,
      scores: scored.scores,
      certificationStatus: scored.certificationStatus,
      headline: scored.headline,
    }),
  }).catch(() => {}) // fire-and-forget — never blocks the trainee's results screen
}

function ScoreBar({ value }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1,2,3,4].map(n => (
        <div key={n} style={{ width: 28, height: 10, borderRadius: 3, background: n <= value ? LEVEL_COLORS[value] : C.navyLt, transition: 'background 0.4s' }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 11, color: LEVEL_COLORS[value] || C.gray, fontWeight: 700, fontFamily: 'monospace' }}>
        {LEVEL_LABELS[value] || '--'}
      </span>
    </div>
  )
}

export default function SimulationPage() {
  const [screen, setScreen] = useState('select')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [exchanges, setExchanges] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [pendingOpeningLine, setPendingOpeningLine] = useState(null)
  const [industryId, setIndustryId] = useState(null)
  const [trainingTypeId, setTrainingTypeId] = useState(null)
  const [scenarios, setScenarios] = useState(SCENARIOS) // local array = instant first paint; replaced below if the DB fetch succeeds
  const [scenarioSource, setScenarioSource] = useState('local')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIndustryId(sessionStorage.getItem('selectedIndustry'))
    setTrainingTypeId(sessionStorage.getItem('selectedTrainingType'))
  }, [])

  // Prefer live content from Supabase; silently keep the bundled fallback
  // (already in state) if the DB is unreachable or RLS ever misfires — a
  // trainee mid-scenario should never see a blank screen over a fetch error.
  useEffect(() => {
    fetch('/api/scenarios?set=client')
      .then(res => res.json())
      .then(data => {
        if (data.source === 'supabase' && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
          setScenarios(data.scenarios)
          setScenarioSource('supabase')
        }
      })
      .catch(() => {}) // stay on the local fallback already in state
  }, [])

  const industry = INDUSTRIES.find(i => i.id === industryId) || null
  const trainingType = industryId ? (TRAINING_TYPES[industryId] || []).find(t => t.id === trainingTypeId) : null
  const filteredScenarios = industryId && trainingTypeId
    ? scenarios.filter(s => s.industry === industryId && s.trainingType === trainingTypeId)
    : scenarios

  const chatEnd = useRef(null)
  const audioRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const messagesRef = useRef([])
  const selectedRef = useRef(null)
  const isLoading = useRef(false)
  const silenceTimerRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceCheckRef = useRef(null)

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

useEffect(() => {
  return () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (silenceCheckRef.current) cancelAnimationFrame(silenceCheckRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }
}, [])
  // ── SPEAK ─────────────────────────────────────────────────────────────────
  const speakText = useCallback(async (text, autoMic = false) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setSpeaking(true)
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) { setSpeaking(false); if (autoMic) startRecording(); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setSpeaking(false)
        audioRef.current = null
        URL.revokeObjectURL(url)
        if (autoMic && !isLoading.current) startRecording()
      }
      audio.onerror = () => {
        setSpeaking(false)
        audioRef.current = null
        if (autoMic && !isLoading.current) startRecording()
      }
      await audio.play()
    } catch {
      setSpeaking(false)
      if (autoMic && !isLoading.current) startRecording()
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setSpeaking(false)
  }, [])

  // ── SILENCE DETECTION ─────────────────────────────────────────────────────
  // Frequency-filtered VAD: only measures energy in the 85-3000 Hz speech band.
  // Kitchen noise (hood fans, dishwashers, HVAC) lives outside this range and
  // is ignored. Amplitude threshold raised to 25 to handle quiet/distant mics.
  function startSilenceDetection(stream, onSilence) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioContextRef.current = audioCtx
    const analyser = audioCtx.createAnalyser()
    analyserRef.current = analyser
    analyser.fftSize = 512
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const data = new Uint8Array(analyser.frequencyBinCount)
    const sampleRate = audioCtx.sampleRate
    const binCount = analyser.frequencyBinCount
    const hzPerBin = sampleRate / analyser.fftSize

    // Speech band: 85 Hz - 3000 Hz
    const speechLow  = Math.floor(85   / hzPerBin)
    const speechHigh = Math.ceil(3000  / hzPerBin)

    let silenceStart = null

    function check() {
      analyser.getByteFrequencyData(data)

      // Average energy only within the speech frequency band
      let sum = 0
      let count = 0
      for (let i = speechLow; i <= Math.min(speechHigh, binCount - 1); i++) {
        sum += data[i]
        count++
      }
      const speechAvg = count > 0 ? sum / count : 0

      if (speechAvg < 25) {
        if (!silenceStart) silenceStart = Date.now()
        else if (Date.now() - silenceStart > SILENCE_MS) {
          onSilence()
          return
        }
      } else {
        silenceStart = null
      }
      silenceCheckRef.current = requestAnimationFrame(check)
    }
    silenceCheckRef.current = requestAnimationFrame(check)
  }

  function stopSilenceDetection() {
    if (silenceCheckRef.current) cancelAnimationFrame(silenceCheckRef.current)
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
  }

  // ── WHISPER MIC ───────────────────────────────────────────────────────────
  async function startRecording() {
    if (isLoading.current || listening) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      setListening(true)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stopSilenceDetection()
        stream.getTracks().forEach(t => t.stop())
        setListening(false)

        if (chunksRef.current.length === 0) return

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size < 1000) return // too short, ignore

        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const { text } = await res.json()
          if (text?.trim()) await handleSend(text.trim())
        } catch {}
      }

      mediaRecorder.start()

      // Start silence detection — auto-stop when user stops talking
      startSilenceDetection(stream, () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      })

      // Safety max 60s
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      }, 60000)

    } catch (err) {
      setListening(false)
      console.error('Mic error:', err)
    }
  }

  function stopRecording() {
    stopSilenceDetection()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    setListening(false)
  }

  // ── SEND ──────────────────────────────────────────────────────────────────
  async function handleSend(userText) {
    if (!userText?.trim() || isLoading.current) return
    isLoading.current = true
    setLoading(true)
    setInput('')

    const newMsgs = [...messagesRef.current, { role: 'user', content: userText }]
    setMessages(newMsgs)
    messagesRef.current = newMsgs
    setExchanges(c => c + 1)

    try {
      const aiText = await callAI({
        system: buildSystemPrompt(selectedRef.current),
        messages: newMsgs,
      })
      const scored = parseScoringResult(aiText)
      if (scored) {
        setResult(scored)
        persistResult(selectedRef.current, scored)
        setScreen('results')
      } else {
        const updatedMsgs = [...newMsgs, { role: 'assistant', content: aiText }]
        setMessages(updatedMsgs)
        messagesRef.current = updatedMsgs
        isLoading.current = false
        setLoading(false)
        await speakText(aiText, true) // speak then auto-mic
        return
      }
    } catch {
      const errMsgs = [...messagesRef.current, { role: 'assistant', content: 'Connection error — please try again.' }]
      setMessages(errMsgs)
      messagesRef.current = errMsgs
    }
    isLoading.current = false
    setLoading(false)
  }

  // ── BEGIN ─────────────────────────────────────────────────────────────────
  async function beginSim() {
    setScreen('sim')
    setMessages([])
    messagesRef.current = []
    setResult(null)
    setExchanges(0)
    setPendingOpeningLine(null)
    isLoading.current = true
    setLoading(true)

    try {
      const text = await callAI({
        system: buildSystemPrompt(selected),
        messages: [{ role: 'user', content: '[BEGIN SIMULATION — deliver your opening line now, in character, no preamble]' }],
      })
      isLoading.current = false
      setLoading(false)
      setPendingOpeningLine(text) // hold here — wait for user gesture
    } catch {
      setMessages([{ role: 'assistant', content: 'Connection error.' }])
      isLoading.current = false
      setLoading(false)
    }
  }

  // ── LAUNCH (user gesture unlocks audio then starts sim) ───────────────────
  async function launchSimWithGesture() {
    if (!pendingOpeningLine) return
    const text = pendingOpeningLine
    setPendingOpeningLine(null)
    const initMsgs = [{ role: 'assistant', content: text }]
    setMessages(initMsgs)
    messagesRef.current = initMsgs
    await speakText(text, true)
  }

  async function endAndScore() {
  stopSpeaking()
  stopRecording()
  isLoading.current = true
  setLoading(true)
  try {
    const apiMsgs = [...messagesRef.current, { 
      role: 'user', 
      content: '[END SIMULATION] Output SIMULATION_COMPLETE followed immediately by the JSON scoring block. Do not speak as the character. Do not add any text before or after the JSON.' 
    }]
    const text = await callAI({ 
      system: buildSystemPrompt(selectedRef.current), 
      messages: apiMsgs, 
      max_tokens: 800 
    })
    const scored = parseScoringResult(text)
    if (scored) { 
      setResult(scored)
      persistResult(selectedRef.current, scored)
      setScreen('results') 
    } else {
      // Force it with a second attempt
      const retry = await callAI({
        system: buildSystemPrompt(selectedRef.current) + '\n\nCRITICAL: You MUST output SIMULATION_COMPLETE followed by valid JSON now. Nothing else.',
        messages: [...apiMsgs, { role: 'assistant', content: text }, { role: 'user', content: 'Output the SIMULATION_COMPLETE JSON scoring block now.' }],
        max_tokens: 800
      })
      const scoredRetry = parseScoringResult(retry)
      if (scoredRetry) { setResult(scoredRetry); persistResult(selectedRef.current, scoredRetry); setScreen('results') }
    }
  } catch {}
  isLoading.current = false
  setLoading(false)
}

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (screen === 'select') return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>Back to Platform</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>Days 1-3 · Role-Play Simulations</span>
        </div>
        <span className="label">{industry ? `${industry.label}${trainingType ? ' · ' + trainingType.label : ''}` : 'Live AI Simulations'}</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 4 }}>Role-Play Scenarios</h1>
        <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 8 }}>
          {scenarioSource === 'supabase' ? '● Content loaded from database' : '○ Content loaded from local fallback'}
        </p>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Fully conversational — AI speaks, mic opens automatically, you respond naturally.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredScenarios.map((s, i) => (
            <div key={s.id} className={`card fade-up-${i+1}`} style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => { setSelected(s); selectedRef.current = s; setScreen('brief') }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.navyLt; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F4F6F9', border: '1.5px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>{s.id} · {s.day}</span>
                    <span style={{ fontSize: 10, color: s.difficulty === 'Advanced' ? '#b87333' : C.greenLt, background: s.difficulty === 'Advanced' ? 'rgba(184,115,51,0.15)' : 'rgba(74,112,48,0.15)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{s.difficulty}</span>
                    {s.dataPacket && <span style={{ fontSize: 10, color: '#6B7280' }}>Data packet included</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{s.focus}</div>
                </div>
                <div style={{ color: '#1C2B5E', fontSize: 20 }}>›</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── BRIEF ─────────────────────────────────────────────────────────────────
  if (screen === 'brief' && selected) return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }}>
        <button className="btn-ghost" style={{ marginBottom: 24 }} onClick={() => setScreen('select')}>Back to Scenarios</button>
        <span className="label">{selected.id} · {selected.day}</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 20 }}>{selected.title}</h1>
        <div className="card fade-up-1" style={{ marginBottom: 14 }}>
          <span className="label">Scenario Context</span>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151' }}>{selected.context}</p>
        </div>
        {selected.dataPacket && (
          <div className="card fade-up-2" style={{ marginBottom: 14 }}>
            <span className="label">Data Packet</span>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{selected.dataPacket.headers.map((h,i) => <th key={i} style={{ color: '#1C2B5E', padding: '4px 8px', textAlign: 'left', borderBottom: `1px solid ${C.navyLt}` }}>{h}</th>)}</tr></thead>
                <tbody>{selected.dataPacket.rows.map((row, ri) => <tr key={ri}>{row.map((cell,ci) => <td key={ci} style={{ color: '#374151', padding: '5px 8px', borderBottom: `1px solid rgba(0,0,0,0.04)`, fontSize: 12 }}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        {/* Real-world condition callout */}
        <div className="fade-up-2" style={{ marginBottom: 14, background: 'rgba(28,43,94,0.04)', border: '1.5px solid #1C2B5E', borderLeft: '4px solid #0D9488', borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ fontSize: 10, color: '#0D9488', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Real-World Condition</div>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>
            In practice, difficult client conversations rarely come with complete information. Part of what this simulation measures is your ability to lead with confidence, communicate transparently about what you know and what you are still verifying, and commit to a clear follow-through — without having all the answers.
          </p>
        </div>

        <div className="card fade-up-3" style={{ marginBottom: 14 }}>
          <span className="label">Success Criteria</span>
          {selected.successCriteria.map((c, i) => <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}><span style={{ color: '#1C2B5E' }}>+</span>{c}</div>)}
        </div>
        <div className="card fade-up-4" style={{ marginBottom: 24, borderColor: '#1C2B5E', background: 'rgba(28,43,94,0.04)' }}>
          <span className="label">Opening Line — Delivered by AI Client</span>
          <p style={{ fontSize: 15, fontStyle: 'italic', color: '#1C2B5E', lineHeight: 1.6 }}>"{selected.openingLine}"</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={beginSim}>Begin Simulation →</button>
        </div>
      </div>
    </div>
  )

  // ── SIMULATION ────────────────────────────────────────────────────────────
  if (screen === 'sim') return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes wave{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}
        @keyframes ripple{0%{box-shadow:0 0 0 0 rgba(74,174,74,0.5)}70%{box-shadow:0 0 0 16px rgba(74,174,74,0)}100%{box-shadow:0 0 0 0 rgba(74,174,74,0)}}
      `}</style>

      {/* Header */}
      <div style={{ background: '#F4F6F9', borderBottom: `1px solid ${C.navyLt}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => { stopSpeaking(); stopRecording(); setScreen('select') }}>Exit</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#1C2B5E', fontWeight: 700, letterSpacing: 1 }}>{selected.id} · LIVE SIMULATION · VOICE</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.title}</div>
        </div>

        {/* Status indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20,
          background: speaking ? 'rgba(106,176,245,0.1)' : listening ? 'rgba(74,174,74,0.1)' : 'rgba(107,114,128,0.08)',
          border: `1px solid ${speaking ? '#6ab0f580' : listening ? '#4aae4a80' : '#6B728040'}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: speaking ? '#6ab0f5' : listening ? '#4aae4a' : '#9CA3AF',
            animation: (speaking || listening) ? 'pulse 1s infinite' : 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: speaking ? '#6ab0f5' : listening ? '#4aae4a' : '#9CA3AF' }}>
            {speaking ? 'AI Speaking' : listening ? 'Listening...' : loading ? 'Processing...' : 'Ready'}
          </span>
        </div>

      </div>

      {/* Ready banner — shown while AI opening line is loaded but not yet played */}
      {pendingOpeningLine && !loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(244,246,249,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{
            maxWidth: 520, background: '#FFFFFF', borderRadius: 14,
            border: '2px solid #1C2B5E', padding: '40px 36px',
            boxShadow: '0 8px 32px rgba(28,43,94,0.12)',
          }}>
            <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              {selected?.id} · Live Simulation
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B5E', marginBottom: 14, lineHeight: 1.3 }}>
              Scenario Loaded — Ready When You Are
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 8 }}>
              Take a moment to review the scenario data from your printed materials.
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 32 }}>
              When you click <strong style={{ color: '#1C2B5E' }}>Begin Simulation</strong>, the AI client will deliver their opening line and your microphone will open automatically after they finish speaking.
            </p>
            <button
              className="btn-primary"
              style={{ fontSize: 15, padding: '14px 36px', letterSpacing: 0.5 }}
              onClick={launchSimWithGesture}
            >
              Begin Simulation →
            </button>
          </div>
        </div>
      )}

      {/* Loading state while fetching opening line */}
      {loading && messages.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(244,246,249,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2].map(n => <div key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: '#1C2B5E', animation: `pulse 1s ${n*0.2}s infinite` }} />)}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Preparing scenario…</div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 780, width: '100%', margin: '0 auto' }}>

        {/* Speaking animation */}
        {speaking && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, padding: '16px 0' }}>
            {[0,1,2,3,4,5,6].map(n => (
              <div key={n} style={{ width: 4, height: 28, borderRadius: 2, background: C.gold, animation: `wave 0.8s ${n*0.1}s infinite ease-in-out` }} />
            ))}
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6B7280' }}>AI Client Speaking</span>
          </div>
        )}

        {/* Listening indicator */}
        {listening && !speaking && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4aae4a', animation: 'ripple 1.2s infinite' }} />
            <span style={{ fontSize: 13, color: '#4aae4a', fontWeight: 600 }}>Listening — speak now</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: msg.role === 'user' ? '#1C2B5E' : '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: msg.role === 'user' ? '#FFFFFF' : '#0D9488', flexShrink: 0 }}>
              {msg.role === 'user' ? 'GM' : 'AI'}
            </div>
            <div style={{ background: msg.role === 'user' ? '#1C2B5E' : '#FFFFFF', border: `1.5px solid ${msg.role === 'user' ? '#1C2B5E' : '#D1D5DB'}`, borderRadius: 10, padding: '12px 16px', maxWidth: '80%', borderTopRightRadius: msg.role === 'user' ? 2 : 10, borderTopLeftRadius: msg.role === 'assistant' ? 2 : 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 10, color: msg.role === 'assistant' ? '#0D9488' : 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                {msg.role === 'assistant' ? 'AI CLIENT' : 'YOU — GM'}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: msg.role === 'user' ? '#FFFFFF' : '#1A1A1A', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              {msg.role === 'assistant' && (
                <button onClick={() => speakText(msg.content)} style={{ marginTop: 8, background: 'transparent', border: '1.5px solid #D1D5DB', borderRadius: 4, padding: '3px 10px', color: '#6B7280', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Replay (HD)
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#0D9488', fontWeight: 700 }}>AI</div>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderRadius: 10, borderTopLeftRadius: 2, padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 5 }}>{[0,1,2].map(n => <div key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, animation: `pulse 1s ${n*0.2}s infinite` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Footer — type fallback only, no mic button */}
      <div style={{ background: '#F4F6F9', borderTop: `1px solid ${C.navyLt}`, padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea rows={2} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = input.trim(); setInput(''); handleSend(t) } }}
              placeholder="Or type here and press Enter..."
              disabled={loading}
              style={{ flex: 1, background: '#F4F6F9', color: '#1C2B5E', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = C.gold}
              onBlur={e => e.target.style.borderColor = C.navyLt}
            />
            <button className="btn-primary" onClick={() => { const t = input.trim(); setInput(''); handleSend(t) }} disabled={loading || !input.trim()}>Send</button>
            <button onClick={endAndScore} disabled={loading || messages.length < 2}
              style={{ background: 'transparent', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: messages.length < 2 ? '#9CA3AF' : '#1C2B5E', cursor: messages.length < 2 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              End & Score
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
            {speaking ? 'AI is speaking...' : listening ? 'Mic open — speak naturally, pausing will send automatically' : 'Mic opens automatically after AI speaks · or type above'}
          </div>
          {speaking && <div style={{ textAlign: 'right', marginTop: 4 }}><button onClick={stopSpeaking} style={{ fontSize: 11, color: '#e05555', background: 'transparent', border: 'none', cursor: 'pointer' }}>Skip AI response</button></div>}
        </div>
      </div>
    </div>
  )

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (screen === 'results' && result) {
    const total = Object.values(result.scores).reduce((a,b) => a+b, 0)
    const statusColor = result.certificationStatus.includes('Certified — Client') ? C.green : result.certificationStatus.includes('Conditional') ? '#b87333' : C.red
    return (
      <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }}>
          <span className="label fade-up">CommunicateIQ · AI Assessment Results</span>
          <h1 className="section-title fade-up" style={{ marginBottom: 4 }}>{selected.title}</h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>{selected.id} · {selected.focus}</p>
          <div className="card fade-up-1" style={{ border: '2px solid #1C2B5E', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span className="label">Simulation Complete — AI Assessment</span>
                <div style={{ fontSize: 16, fontWeight: 600, maxWidth: 480 }}>{result.headline}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'monospace', color: total >= 16 ? C.green : total >= 13 ? '#b87333' : C.red }}>{total}/20</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Overall Score</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {DIMENSIONS.map(dim => (
                <div key={dim.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ width: 150, fontSize: 12, fontWeight: 600, color: '#374151' }}>{dim.label}</div>
                  <ScoreBar value={result.scores[dim.id]} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ background: 'rgba(55,86,35,0.15)', border: `1px solid ${C.green}`, borderRadius: 8, padding: 14 }}>
                <div style={{ color: C.greenLt, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Strengths</div>
                {result.strengths.map((s,i) => <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 5, display: 'flex', gap: 6 }}><span style={{ color: C.greenLt }}>+</span>{s}</div>)}
              </div>
              <div style={{ background: 'rgba(192,0,0,0.1)', border: `1px solid ${C.red}`, borderRadius: 8, padding: 14 }}>
                <div style={{ color: '#e05555', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Development Gaps</div>
                {result.gaps.map((g,i) => <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 5, display: 'flex', gap: 6 }}><span style={{ color: '#e05555' }}>!</span>{g}</div>)}
              </div>
            </div>
            <div style={{ background: '#F4F6F9', borderRadius: 8, padding: 14, marginBottom: 14, borderLeft: '3px solid #1C2B5E' }}>
              <div style={{ color: '#1C2B5E', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Distinguished Version Would Have Said</div>
              <div style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.6, color: '#374151' }}>"{result.distinguishedExample}"</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${statusColor}22`, border: `1px solid ${statusColor}`, borderRadius: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor }} />
              <div style={{ color: statusColor, fontWeight: 700, fontSize: 13 }}>{result.certificationStatus}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => setScreen('brief')}>Retry This Scenario</button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setScreen('select')}>Try Another</button>
              <Link href="/financial" className="btn-primary">Continue: Financial Storytelling</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}
