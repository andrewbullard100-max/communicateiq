// ─── Transactional email ────────────────────────────────────────────────────
// Used only for the self-service "forgot password" flow. Plain fetch against
// Resend's REST API rather than pulling in an SDK — this is the only email
// this app sends, so a dependency for it isn't worth it.
//
// Not configured by default. Like SSO (see lib/sso.js) and the AI provider
// keys, this requires the deployment owner to set RESEND_API_KEY (and
// optionally RESEND_FROM_EMAIL) as an env var — see DEPLOY.md. Every caller
// checks emailConfigured() first and degrades gracefully (tells the person
// to contact their admin) rather than silently failing or claiming success.

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendPasswordResetEmail(to, resetUrl) {
  if (!emailConfigured()) {
    console.warn('sendPasswordResetEmail called but RESEND_API_KEY is not set — no email sent.')
    return { sent: false }
  }

  const from = process.env.RESEND_FROM_EMAIL || 'CommunicateIQ <onboarding@resend.dev>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Reset your CommunicateIQ password',
      html: `
        <p>Someone requested a password reset for this email address on CommunicateIQ.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email — your password hasn't been changed.</p>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Resend send error:', res.status, text)
    return { sent: false }
  }
  return { sent: true }
}
