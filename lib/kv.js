import { Redis } from '@upstash/redis'

// ─── Persistent results storage ─────────────────────────────────────────────
// Backed by Upstash Redis (Vercel's recommended Redis integration —
// Vercel Dashboard → Storage → Redis → Connect Project). This auto-injects
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, which is all this file
// needs. No schema or migration required.
//
// If those env vars aren't set yet (e.g. local dev before Storage is
// connected), every function below fails soft — the app keeps working,
// simulation results just aren't persisted until storage is configured.

const RESULTS_KEY = 'communicateiq:results'
const MAX_RESULTS = 5000 // trim oldest beyond this to keep the list bounded

let redis = null
function getClient() {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

export function storageConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

export async function saveResult(result) {
  const client = getClient()
  if (!client) throw new Error('Results storage is not configured (missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).')
  await client.lpush(RESULTS_KEY, JSON.stringify(result))
  await client.ltrim(RESULTS_KEY, 0, MAX_RESULTS - 1)
}

function parseEntry(entry) {
  if (!entry) return null
  if (typeof entry === 'string') {
    try { return JSON.parse(entry) } catch { return null }
  }
  return entry // already an object
}

export async function getAllResults() {
  const client = getClient()
  if (!client) return []
  const raw = await client.lrange(RESULTS_KEY, 0, -1)
  return raw.map(parseEntry).filter(Boolean)
}

export async function getUserResults(email) {
  const all = await getAllResults()
  const target = (email || '').toLowerCase()
  return all.filter(r => (r.userEmail || '').toLowerCase() === target)
}
