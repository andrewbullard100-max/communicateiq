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
// Usage mirrors the old inline code:
//   const handle = await playStreamedSpeech(res, {
//     onEnded: () => { ... },
//     onError: () => { ... },
//   })
//   handle.audio   // the underlying <audio> element, for pause/ref etc.
//   handle.stop()  // pause + cleanup (object URLs, source buffers)

const MIME = 'audio/mpeg'

function supportsStreamingPlayback() {
  return (
    typeof window !== 'undefined' &&
    'MediaSource' in window &&
    typeof MediaSource.isTypeSupported === 'function' &&
    MediaSource.isTypeSupported(MIME) &&
    typeof ReadableStream !== 'undefined'
  )
}

async function playViaMediaSource(res, { onEnded, onError } = {}) {
  const mediaSource = new MediaSource()
  const url = URL.createObjectURL(mediaSource)
  const audio = new Audio(url)

  let sourceBuffer = null
  let cleanedUp = false
  const pendingChunks = []
  let streamDone = false

  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    URL.revokeObjectURL(url)
  }

  audio.addEventListener('ended', () => { cleanup(); onEnded?.() })
  audio.addEventListener('error', () => { cleanup(); onError?.() })

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
      return
    }
    sourceBuffer.addEventListener('updateend', () => {
      pump()
      maybeEndStream()
    })

    const reader = res.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          streamDone = true
          maybeEndStream()
          break
        }
        pendingChunks.push(value)
        pump()
      }
    } catch (err) {
      onError?.(err)
    }
  })

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
