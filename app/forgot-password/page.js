'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setMessage(data.message || 'If an account exists for that email, reset instructions have been sent.')
      setSubmitted(true)
    } catch {
      setMessage('If an account exists for that email, reset instructions have been sent.')
      setSubmitted(true)
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
          Reset Password
        </div>

        {submitted ? (
          <>
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, marginTop: 12 }}>{message}</p>
            <Link href="/login" style={{ display: 'block', marginTop: 16, fontSize: 13, color: '#1C2B5E', fontWeight: 600 }}>← Back to Sign In</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Enter your email and we'll send you a link to reset your password.</p>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Email</label>
              <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
            </div>
            <button type="submit" disabled={loading} style={{
              background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <Link href="/login" style={{ fontSize: 12.5, color: '#6B7280', textAlign: 'center' }}>← Back to Sign In</Link>
          </form>
        )}
      </div>
    </div>
  )
}
