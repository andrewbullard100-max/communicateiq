'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const PROVIDER_LABELS = {
  'azure-ad': 'Continue with Microsoft',
  okta: 'Continue with Okta',
  google: 'Continue with Google',
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ssoProviders, setSsoProviders] = useState([])

  useEffect(() => {
    getProviders().then(providers => {
      if (!providers) return
      setSsoProviders(Object.values(providers).filter(p => p.id !== 'credentials'))
    })
    const ssoError = params.get('error')
    if (ssoError && ssoError !== 'CredentialsSignin') {
      // NextAuth funnels OAuthCallback / AccessDenied errors here; the
      // profile() function's thrown message isn't preserved verbatim by
      // NextAuth's redirect, so this is intentionally generic — the real
      // reason is in login_events (Admin Console → Sign-In Activity) for
      // whoever needs to debug a specific rejected sign-in.
      setError('Single sign-on failed. Contact your organization admin if this continues.')
    }
  }, [params])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Incorrect email or password.')
      return
    }
    router.push(callbackUrl)
    router.refresh()
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
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginTop: 14 }}>
          Executive Communication Training
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: '#FFFFFF', borderRadius: 12, padding: '32px 30px',
        width: '100%', maxWidth: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1C2B5E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          Sign In
        </div>

        {ssoProviders.length > 0 && (
          <>
            {ssoProviders.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => signIn(p.id, { callbackUrl })}
                style={{
                  background: '#fff', color: '#1C2B5E', border: '1.5px solid #D1D5DB',
                  borderRadius: 8, padding: '10px 16px', fontSize: 13.5, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {PROVIDER_LABELS[p.id] || `Continue with ${p.name}`}
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>
          </>
        )}

        <div>
          <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Email</label>
          <input
            type="email" required autoFocus value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Password</label>
          <input
            type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14 }}
          />
        </div>

        {error && (
          <div style={{ color: '#C00000', fontSize: 12.5, background: 'rgba(192,0,0,0.06)', border: '1px solid rgba(192,0,0,0.2)', borderRadius: 6, padding: '8px 10px' }}>
            {error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          style={{
            background: '#0D9488', color: '#FFFFFF', border: 'none',
            borderRadius: 8, padding: '12px 20px', fontSize: 14,
            fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: 6,
          }}
        >
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>

        <div style={{ fontSize: 11.5, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
          Access is provisioned by your organization's administrator.
        </div>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
