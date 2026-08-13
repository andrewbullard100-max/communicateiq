import OpenAI from 'openai'
import { createHash } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { checkAndRecordUsage, RateLimitError } from '../../../lib/rateLimit'
import { getSupabaseAdmin } from '../../../lib/supabase'

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

const CACHE_BUCKET = 'tts-cache'

// Content-addressed: same (voice, text) always maps to the same object.
// Most conversational lines are freshly generated per turn by the AI and
// will rarely repeat verbatim — for those this is just a cheap miss. What
// it reliably catches is the stuff that IS identical every time: the QBR
// page's silent audio-unlock ping (always the literal string "ready"),
// scenario openers on retries of the same scenario, and any other
// boilerplate. No caller-side flag needed — it self-selects.
function cacheKeyFor(voice, text) {
  const hash = createHash('sha256').update(`${voice}::${text}`).digest('hex')
  return { hash, path: `${hash}.mp3` }
}

async function tryServeFromCache(admin, path) {
  const { data, error } = await admin.storage.from(CACHE_BUCKET).download(path)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

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
    const { hash, path } = cacheKeyFor(voice, clean)
    const admin = getSupabaseAdmin()

    const cached = await tryServeFromCache(admin, path).catch((err) => {
      console.error('TTS cache read failed (continuing to live synthesis):', err)
      return null
    })

    if (cached) {
      // Fire-and-forget: a dropped hit count is just slightly stale
      // analytics, never worth delaying the response for.
      admin.rpc('increment_tts_cache_hit', { p_hash: hash }).then(() => {}, () => {})
      return new Response(cached, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cached.length.toString(),
          'X-TTS-Cache': 'hit',
        },
      })
    }

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
      writeToCache(admin, { hash, path, voice, text: clean, buffer }).catch((err) =>
        console.error('TTS cache write failed:', err)
      )
      return new Response(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'X-TTS-Cache': 'miss',
        },
      })
    }

    // Forward each chunk to the client immediately, while also collecting it
    // for the cache. The cache write is awaited inside the stream's own
    // completion step (right before controller.close()) rather than fired
    // off separately — Netlify's function invocation stays alive until the
    // response stream it's serving actually closes, so this is the one
    // place background work is guaranteed to finish rather than possibly
    // getting cut off after the last audio byte reaches the browser.
    const reader = speech.body.getReader()
    const chunks = []
    const mirroredStream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()
        if (done) {
          try {
            const buffer = Buffer.concat(chunks)
            await writeToCache(admin, { hash, path, voice, text: clean, buffer })
          } catch (err) {
            console.error('TTS cache write failed:', err)
          }
          controller.close()
          return
        }
        chunks.push(value)
        controller.enqueue(value)
      },
      cancel(reason) {
        reader.cancel(reason)
      },
    })

    return new Response(mirroredStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'Transfer-Encoding': 'chunked',
        'X-TTS-Cache': 'miss',
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

async function writeToCache(admin, { hash, path, voice, text, buffer }) {
  const { error: uploadError } = await admin.storage
    .from(CACHE_BUCKET)
    .upload(path, buffer, { contentType: 'audio/mpeg', upsert: true })
  if (uploadError) throw uploadError

  const { error: dbError } = await admin.from('tts_cache').upsert(
    {
      text_hash: hash,
      voice,
      storage_path: path,
      byte_size: buffer.length,
      text_preview: text.slice(0, 200),
    },
    { onConflict: 'text_hash' }
  )
  if (dbError) throw dbError
}
