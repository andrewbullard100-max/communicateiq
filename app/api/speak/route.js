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

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: clean,
      speed: 0.95,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
