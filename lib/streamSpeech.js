// Progressive playback for /api/speak.
//
// The old pattern (still fine to use elsewhere) was:
//   const res = await fetch('/api/speak', ...)
//   const blob = await res.blob()   // <- waits for the ENTIRE body
//   audio.src = URL.createObjectURL(blob)
//
// `res.blob()` buffers the whole response before resolving, so even though
// the server now streams chunks as OpenAI generates them, the browser was
// still sitting on its hands until the last byte arrived. This helper reads
// the response body incrementally and feeds it to a MediaSource so playback
// can start on the first chunk. Browsers that can't do MSE for audio/mpeg
// (older Safari, some mobile browsers) fall back to the old blob behavior
// automatically — same end result, just no early-start benefit there.
//
// Jitter buffer: rather than calling play() the instant the first byte
// lands, we wait until BUFFER_TARGET_MS worth of audio is actually decoded
// into the SourceBuffer (or the stream finishes, if it's shorter than that).
// Network chunks don't arrive at an even cadence — without this, a short gap
// between the 1st and 2nd chunk shows up as an audible stall right at the
// start of every line. A small pre-roll absorbs that jitter. If buffering
// stalls for longer than PREBUFFER_TIMEOUT_MS (a slow connection, or OpenAI
// itself lagging), we start playback anyway with whatever's buffered rather
// than making the person wait indefinitely — mid-stream stalls still happen
// on any HTTP-streamed audio, but the browser's own buffered/waiting/resume
// handling absorbs those the same way it does for a normal <audio> stream.
//
// Usage mirrors the old inline code:
//   const handle = await playStreamedSpeech(res, {
//     onEnded: () => { ... },
//     onError: () => { ... },
//   })
//   handle.audio   // the underlying <audio> element, for pause/ref etc.
//   handle.stop()  // pause + cleanup (object URLs, source buffers)

const MIME = 'audio/mpeg'
const BUFFER_TARGET_MS = 150   // pre-roll target before we start playback
const PREBUFFER_TIMEOUT_MS = 700 // don't make the person wait longer than this

function supportsStreamingPlayback() {
  return (
    typeof window !== 'undefined' &&
    'MediaSource' in window &&
    typeof MediaSource.isTypeSupported === 'function' &&
    MediaSource.isTypeSupported(MIME) &&
    typeof ReadableStream !== 'undefined'
  )
}

function bufferedAheadMs(sourceBuffer) {
  try {
    const { buffered } = sourceBuffer
    if (!buffered.length) return 0
    // We only ever append sequentially from position 0, so the last range's
    // end is the total buffered duration.
    return buffered.end(buffered.length - 1) * 1000
  } catch {
    return 0
  }
}

async function playViaMediaSource(res, { onEnded, onError, bufferTargetMs = BUFFER_TARGET_MS } = {}) {
  const mediaSource = new MediaSource()
  const url = URL.createObjectURL(mediaSource)
  const audio = new Audio(url)

  let sourceBuffer = null
  let cleanedUp = false
  let started = false
  const pendingChunks = []
  let streamDone = false

  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    URL.revokeObjectURL(url)
  }

  audio.addEventListener('ended', () => { cleanup(); onEnded?.() })
  audio.addEventListener('error', () => { cleanup(); onError?.() })

  // Resolves once we've hit the pre-roll target, the stream has already
  // finished (short lines), or the timeout fires — whichever comes first.
  let resolvePrebuffer
  const prebuffered = new Promise((resolve) => { resolvePrebuffer = resolve })
  const prebufferTimeout = setTimeout(() => resolvePrebuffer(), PREBUFFER_TIMEOUT_MS)

  function checkPrebuffer() {
    if (started) return
    if (streamDone || bufferedAheadMs(sourceBuffer) >= bufferTargetMs) {
      clearTimeout(prebufferTimeout)
      resolvePrebuffer()
    }
  }

  function pump() {
    if (!sourceBuffer || sourceBuffer.updating || pendingChunks.length === 0) return
    const chunk = pendingChunks.shift()
    try {
      sourceBuffer.appendBuffer(chunk)
    } catch (err) {
      // Buffer full or stream errored mid-append — bail to onError rather
      // than leaving playback silently stuck.
      onError?.(err)
    }
  }

  function maybeEndStream() {
    if (streamDone && pendingChunks.length === 0 && sourceBuffer && !sourceBuffer.updating) {
      try { mediaSource.endOfStream() } catch { /* already ended */ }
    }
  }

  mediaSource.addEventListener('sourceopen', async () => {
    try {
      sourceBuffer = mediaSource.addSourceBuffer(MIME)
    } catch (err) {
      onError?.(err)
      resolvePrebuffer()
      return
    }
    sourceBuffer.addEventListener('updateend', () => {
      pump()
      maybeEndStream()
      checkPrebuffer()
    })

    const reader = res.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          streamDone = true
          maybeEndStream()
          checkPrebuffer()
          break
        }
        pendingChunks.push(value)
        pump()
      }
    } catch (err) {
      onError?.(err)
      resolvePrebuffer()
    }
  })

  await prebuffered
  started = true
  await audio.play()

  return {
    audio,
    stop() {
      audio.pause()
      cleanup()
    },
  }
}

async function playViaBlob(res, { onEnded, onError } = {}) {
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.addEventListener('ended', () => { URL.revokeObjectURL(url); onEnded?.() })
  audio.addEventListener('error', () => { URL.revokeObjectURL(url); onError?.() })
  await audio.play()
  return {
    audio,
    stop() {
      audio.pause()
      URL.revokeObjectURL(url)
    },
  }
}

// res: a fetch Response from /api/speak (not yet consumed).
export async function playStreamedSpeech(res, opts = {}) {
  if (supportsStreamingPlayback()) {
    try {
      return await playViaMediaSource(res, opts)
    } catch {
      // Fall through to blob playback below only if MSE setup itself threw
      // synchronously before consuming the body (rare). If the body was
      // already partially read this will fail too, which is acceptable —
      // it's the same failure mode the old code had.
    }
  }
  return playViaBlob(res, opts)
}
