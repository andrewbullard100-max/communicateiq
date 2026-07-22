import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { checkAndRecordUsage, RateLimitError } from '../../../lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Hard ceiling regardless of what the client requests — a client-controlled
// max_tokens is a direct cost lever, so it's clamped server-side rather than
// trusted as-is.
const MAX_TOKENS_CEILING = 1500

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await checkAndRecordUsage({ userId: session.user.id, orgId: session.user.orgId, route: 'chat' })
  } catch (err) {
    if (err instanceof RateLimitError) return Response.json({ error: err.message, reason: err.reason }, { status: err.status })
    throw err
  }

  try {
    const { messages, system, max_tokens = 1200 } = await req.json()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: Math.min(max_tokens, MAX_TOKENS_CEILING),
      system,
      messages,
    })
    return Response.json({ content: response.content })
  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
