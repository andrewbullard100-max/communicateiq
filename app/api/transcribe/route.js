import OpenAI from 'openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { checkAndRecordUsage, RateLimitError } from '../../../lib/rateLimit'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Whisper's own limit is 25MB; we cap well under that. A voice-conversation
// turn is a few seconds of audio, not minutes — anything hitting this limit
// is either a bug on the client or someone deliberately sending oversized
// payloads.
const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await checkAndRecordUsage({ userId: session.user.id, orgId: session.user.orgId, route: 'transcribe' })
  } catch (err) {
    if (err instanceof RateLimitError) return Response.json({ error: err.message, reason: err.reason }, { status: err.status })
    throw err
  }

  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!audio) return Response.json({ error: 'No audio' }, { status: 400 })
    if (audio.size > MAX_AUDIO_BYTES) {
      return Response.json({ error: 'Audio file too large.' }, { status: 413 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
    })

    return Response.json({ text: transcription.text })
  } catch (err) {
    console.error('Transcription error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
