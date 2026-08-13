import { resetPasswordWithToken } from '../../../../lib/account'

export async function POST(req) {
  try {
    const body = await req.json()
    const result = await resetPasswordWithToken(body.token, body.newPassword)
    return Response.json(result)
  } catch (err) {
    console.error('Reset password error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
