import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { messages, system, max_tokens = 1200 } = await req.json()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens,
      system,
      messages,
    })
    return Response.json({ content: response.content })
  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
