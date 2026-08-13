import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin, getSupabaseScoped } from './supabase'
import { emailConfigured, sendPasswordResetEmail } from './email'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ─── Change password (while signed in) ──────────────────────────────────────
// No email dependency — this always works regardless of whether email
// delivery is configured, which is why it's the primary self-service path
// this app can offer today. Requires knowing the current password, so it
// doesn't need a separate identity-verification step the way a logged-out
// reset does.

export async function changeOwnPassword(orgId, userId, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.')
  }
  const db = getSupabaseScoped(orgId, userId)
  const { data: user, error } = await db.from('users').select('password_hash, sso_subject').eq('id', userId).single()
  if (error) throw new Error(error.message)

  if (!user.password_hash) {
    // SSO-only account (see lib/auth.js's ssoProfile — SSO never sets a
    // password_hash). There's no current password to verify against, and
    // setting one here would create a confusing second sign-in path.
    throw new Error("This account signs in via your organization's SSO and doesn't have a password to change.")
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) throw new Error('Current password is incorrect.')

  const passwordHash = await bcrypt.hash(newPassword, 12)
  const { error: updateErr } = await db.from('users').update({ password_hash: passwordHash }).eq('id', userId)
  if (updateErr) throw new Error(updateErr.message)
  return { ok: true }
}

// ─── Forgot password (signed out) ───────────────────────────────────────────
// Pre-auth — no session, no known org — so this uses the service-role
// client throughout, same as lib/auth.js's ssoProfile/authorize (email is
// globally unique, looked up before any org context exists).

export async function requestPasswordReset(email) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Email is required.')

  const db = getSupabaseAdmin()
  const { data: user, error } = await db
    .from('users')
    .select('id, email, name, status, password_hash')
    .ilike('email', normalizedEmail)
    .maybeSingle()
  if (error) throw new Error(error.message)

  // Deliberately the same response whether or not an account exists, or is
  // SSO-only, or is inactive — this is what stops the endpoint being usable
  // to enumerate which emails have accounts here.
  const genericResult = { ok: true, message: 'If an account exists for that email, reset instructions have been sent.' }

  if (!user || user.status !== 'active' || !user.password_hash) {
    return genericResult
  }

  if (!emailConfigured()) {
    // Honest rather than misleading: this deployment can't actually send
    // the email yet. Safe to say this plainly (it's an operational fact
    // about the deployment, not information about any specific account).
    return { ok: true, message: 'Password reset emails aren\'t set up for this organization yet. Contact your organization admin to reset your password.' }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const { error: updateErr } = await db
    .from('users')
    .update({
      password_reset_token_hash: hashToken(token),
      password_reset_expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    })
    .eq('id', user.id)
  if (updateErr) throw new Error(updateErr.message)

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${token}`
  await sendPasswordResetEmail(user.email, resetUrl)

  return genericResult
}

export async function resetPasswordWithToken(token, newPassword) {
  if (!token) throw new Error('Missing reset token.')
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.')
  }

  const db = getSupabaseAdmin()
  const { data: user, error } = await db
    .from('users')
    .select('id, password_reset_expires_at')
    .eq('password_reset_token_hash', hashToken(token))
    .maybeSingle()
  if (error) throw new Error(error.message)

  if (!user || !user.password_reset_expires_at || new Date(user.password_reset_expires_at) < new Date()) {
    throw new Error('This reset link is invalid or has expired. Request a new one.')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  const { error: updateErr } = await db
    .from('users')
    .update({
      password_hash: passwordHash,
      password_reset_token_hash: null,
      password_reset_expires_at: null,
    })
    .eq('id', user.id)
  if (updateErr) throw new Error(updateErr.message)

  return { ok: true }
}
