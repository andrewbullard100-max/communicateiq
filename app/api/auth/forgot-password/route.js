import { requestPasswordReset } from '../../../../lib/account'

export async function POST(req) {
  try {
    const body = await req.json()
    const result = await requestPasswordReset(body.email)
    return Response.json(result)
  } catch (err) {
    console.error('Request password reset error:', err)
    // Still generic on error — don't let a thrown message leak account
    // existence through an error path that bypasses the normal generic
    // response in lib/account.js.
    return Response.json({ ok: true, message: 'If an account exists for that email, reset instructions have been sent.' })
  }
}
