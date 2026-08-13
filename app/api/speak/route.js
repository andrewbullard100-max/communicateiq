import OpenAI from 'openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { checkAndRecordUsage, RateLimitError } from '../../../lib/rateLimit'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Valid OpenAI TTS voices. None of these are gendered by name — 'alloy' and
// 'shimmer' read fairly neutral, the rest lean masculine/feminine by ear but
// none are documented as strictly one or the other. Callers (simulation/QBR
// pages) should pass an explicit `voice` when a persona's voice matters for
// the scenario; we do not infer it from anyone's name — see MIGRATING.md
// for what this replaced (a name-matching heuristic that, as it turned out,
// no caller ever actually triggered, since none of them sent a name).
const VALID_VOICES = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
const DEFAULT_VOICE = 'alloy'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await checkAndRecordUsage({ userId: session.user.id, orgId: session.user.orgId, route: 'speak' })
  } catch (err) {
    if (err instanceof RateLimitError) return Response.json({ error: err.message, reason: err.reason }, { status: err.status })
    throw err
  }

  try {
    const body = await req.json()
    const { text, voice: requestedVoice } = body

    if (!text?.trim()) return Response.json({ error: 'No text' }, { status: 400 })

    // Strip any scoring blocks before sending to TTS
    const clean = text
      .replace(/SIMULATION_COMPLETE[\s\S]*/g, '')
      .replace(/DELIVERY_COMPLETE[\s\S]*/g, '')
      .trim()

    if (!clean) return Response.json({ error: 'No text after cleaning' }, { status: 400 })

    const voice = VALID_VOICES.has(requestedVoice) ? requestedVoice : DEFAULT_VOICE

    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: clean,
      speed: 0.95,
    })

    // Pipe OpenAI's response straight through as it arrives instead of
    // buffering the full mp3 into memory first. This drops time-to-first-byte
    // from "however long the whole line takes to synthesize" to "however long
    // the first chunk takes" — the client (see lib/streamSpeech.js) plays
    // chunks as they land via MediaSource, with a blob-based fallback for
    // browsers that don't support MSE for audio/mpeg.
    if (!speech.body) {
      // Defensive fallback in case a future SDK/runtime doesn't give us a
      // streamable body — behave like the old buffered path rather than 500.
      const buffer = Buffer.from(await speech.arrayBuffer())
      return new Response(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
        },
      })
    }

    return new Response(speech.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
