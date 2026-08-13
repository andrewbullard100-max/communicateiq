'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#1C2B5E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28, padding: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: 40, color: '#FFFFFF', letterSpacing: '-1px', lineHeight: 1 }}>
          Communicate<span style={{ color: '#0D9488' }}>IQ</span>
        </div>
        <div style={{ height: 4, background: '#0D9488', borderRadius: 2, marginTop: 6 }} />
      </div>

      <div style={{
        background: '#FFFFFF', borderRadius: 12, padding: '32px 30px',
        width: '100%', maxWidth: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1C2B5E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          Set New Password
        </div>

        {!token ? (
          <>
            <p style={{ fontSize: 13.5, color: '#C00000', lineHeight: 1.6, marginTop: 12 }}>
              This reset link is missing its token. Request a new one.
            </p>
            <Link href="/forgot-password" style={{ display: 'block', marginTop: 16, fontSize: 13, color: '#1C2B5E', fontWeight: 600 }}>Request a new link</Link>
          </>
        ) : success ? (
          <>
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, marginTop: 12 }}>
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Go to Sign In</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>New password</label>
              <input type="password" required minLength={8} autoFocus value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>At least 8 characters.</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Confirm new password</label>
              <input type="password" required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
            </div>

            {error && (
              <div style={{ color: '#C00000', fontSize: 12.5, background: 'rgba(192,0,0,0.06)', border: '1px solid rgba(192,0,0,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1C2B5E' }} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
