'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { C } from '../../lib/data'

export default function AccountPage() {
  const { data: session, status } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (status === 'loading') return null
  if (status !== 'authenticated') {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#1C2B5E' }}>Sign in required</div>
          <Link href="/login" className="btn-primary">Go to Sign In</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
          <span style={{ color: '#6B7280', fontSize: 12 }}>{session?.user?.name || session?.user?.email}</span>
        </div>

        <span className="label">My Account</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 20 }}>Change Password</h1>

        <form onSubmit={handleSubmit} className="card fade-up-1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Current password</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>New password</label>
            <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)}
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
          {success && (
            <div style={{ color: C.green, fontSize: 12.5, background: 'rgba(27,107,47,0.08)', border: `1px solid ${C.green}`, borderRadius: 6, padding: '8px 10px' }}>
              Password changed.
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
