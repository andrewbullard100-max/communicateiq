'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { C } from '../../lib/data'

const ROLES = [
  { id: 'learner', label: 'Learner' },
  { id: 'content_author', label: 'Content Author' },
  { id: 'content_approver', label: 'Content Approver' },
  { id: 'manager', label: 'Manager' },
  { id: 'org_admin', label: 'Org Admin' },
  { id: 'corporate_admin', label: 'Corporate Admin' },
]
const ROLE_LABEL = Object.fromEntries(ROLES.map(r => [r.id, r.label]))

const STATUS_COLOR = { active: C.green, invited: '#b87333', suspended: C.red, terminated: '#9CA3AF' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function AdminConsole() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [billing, setBilling] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingBusy, setBillingBusy] = useState(false)
  const [sso, setSso] = useState(null)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [ssoBusy, setSsoBusy] = useState(false)
  const [ssoForm, setSsoForm] = useState({ enabled: false, provider: '', domain: '', tenantId: '' })
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [tempPasswordFor, setTempPasswordFor] = useState(null) // { name, email, password }
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then(async res => {
        if (res.status === 403) { setForbidden(true); setLoading(false); return }
        const data = await res.json()
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    loadUsers()
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'activity') return
    fetch('/api/admin/login-events')
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => {})
  }, [status, tab])

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'billing') return
    setBillingLoading(true)
    fetch('/api/admin/billing')
      .then(res => res.json())
      .then(data => setBilling(data))
      .catch(() => {})
      .finally(() => setBillingLoading(false))
  }, [status, tab])

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'sso') return
    setSsoLoading(true)
    fetch('/api/admin/sso')
      .then(res => res.json())
      .then(data => {
        setSso(data)
        if (data.config) {
          setSsoForm({
            enabled: data.config.sso_enabled || false,
            provider: data.config.sso_provider || (data.availableProviders?.[0]?.id ?? ''),
            domain: data.config.sso_domain || '',
            tenantId: data.config.sso_tenant_id || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setSsoLoading(false))
  }, [status, tab])

  async function handleSaveSso() {
    setSsoBusy(true)
    try {
      const res = await fetch('/api/admin/sso', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ssoForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save SSO settings')
      setToast({ type: 'success', text: 'SSO settings saved.' })
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setSsoBusy(false)
    }
  }

  async function handleSubscribe(planId) {
    setBillingBusy(true)
    try {
      const res = await fetch('/api/admin/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err) {
      setToast({ type: 'error', text: err.message })
      setBillingBusy(false)
    }
  }

  async function handleManageBilling() {
    setBillingBusy(true)
    try {
      const res = await fetch('/api/admin/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal')
      window.location.href = data.url
    } catch (err) {
      setToast({ type: 'error', text: err.message })
      setBillingBusy(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [users]
  )

  async function handleAdd(form) {
    setBusyId('new')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')
      setShowAdd(false)
      setTempPasswordFor({ name: form.name, email: form.email, password: data.tempPassword })
      loadUsers()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleRoleChange(userId, newRole) {
    setBusyId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: [newRole] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')
      loadUsers()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleStatusChange(userId, newStatus) {
    setBusyId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')
      loadUsers()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeactivate(userId) {
    if (!confirm('Deactivate this user? They will no longer be able to sign in. Their training history is kept.')) return
    setBusyId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate user')
      loadUsers()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleResetPassword(user) {
    if (!confirm(`Reset the password for ${user.name}? Their current password will stop working immediately.`)) return
    setBusyId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/password`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setTempPasswordFor({ name: user.name, email: user.email, password: data.tempPassword })
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  if (status === 'loading' || loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray }}>Loading…</div>
  }

  if (forbidden) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.navy }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6 }}>Admin Console</div>
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 18 }}>The Admin Console is restricted to org_admin accounts and above.</div>
          <Link href="/" style={{ color: C.communicateiqRed, fontSize: 13, fontWeight: 600 }}>← Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: C.gold, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Admin Console</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{session?.user?.name || session?.user?.email}</div>
        </div>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>← Home</Link>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['users', 'activity', 'billing', 'sso'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: tab === t ? C.gold : '#fff', color: tab === t ? '#fff' : C.gold,
              }}>
              {t === 'users' ? 'Users' : t === 'activity' ? 'Sign-In Activity' : t === 'billing' ? 'Billing' : 'SSO'}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button onClick={() => setShowAdd(true)}
                style={{ background: C.communicateiqRed, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Add User
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8F9FB', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Name</th>
                    <th style={{ padding: '10px 14px' }}>Email</th>
                    <th style={{ padding: '10px 14px' }}>Role</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px' }}>Last Login</th>
                    <th style={{ padding: '10px 14px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid #EEF0F3', opacity: busyId === u.id ? 0.5 : 1 }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: C.gold }}>{u.name}</td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>{u.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={u.roles[0] || 'learner'}
                          disabled={busyId === u.id}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid #D1D5DB' }}>
                          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                        {u.roles.length > 1 && (
                          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>
                            +{u.roles.length - 1} more
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={u.status}
                          disabled={busyId === u.id}
                          onChange={e => handleStatusChange(u.id, e.target.value)}
                          style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid #D1D5DB', color: STATUS_COLOR[u.status], fontWeight: 600 }}>
                          <option value="active">Active</option>
                          <option value="invited">Invited</option>
                          <option value="suspended">Suspended</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6B7280' }}>{fmtDate(u.lastLoginAt)}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleResetPassword(u)} disabled={busyId === u.id}
                          style={{ fontSize: 12, background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '4px 8px', marginRight: 6, cursor: 'pointer', color: '#374151' }}>
                          Reset password
                        </button>
                        {u.status !== 'terminated' && (
                          <button onClick={() => handleDeactivate(u.id)} disabled={busyId === u.id}
                            style={{ fontSize: 12, background: 'none', border: '1px solid #F0B8B8', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: C.red }}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!sortedUsers.length && (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>No users yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'activity' && (
          <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8F9FB', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>When</th>
                  <th style={{ padding: '10px 14px' }}>User / Email Attempted</th>
                  <th style={{ padding: '10px 14px' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} style={{ borderTop: '1px solid #EEF0F3' }}>
                    <td style={{ padding: '10px 14px', color: '#6B7280' }}>{fmtDate(e.at)}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{e.userName ? `${e.userName} (${e.email})` : e.email}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: e.success ? C.green : C.red }}>
                      {e.success ? 'Signed in' : e.reason === 'bad_password' ? 'Wrong password' : e.reason === 'inactive' ? 'Account inactive' : 'Unknown email'}
                    </td>
                  </tr>
                ))}
                {!events.length && (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>No sign-in activity yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'billing' && (
          <BillingPanel
            data={billing}
            loading={billingLoading}
            busy={billingBusy}
            onSubscribe={handleSubscribe}
            onManage={handleManageBilling}
          />
        )}

        {tab === 'sso' && (
          <SsoPanel
            data={sso}
            loading={ssoLoading}
            busy={ssoBusy}
            form={ssoForm}
            setForm={setSsoForm}
            onSave={handleSaveSso}
          />
        )}
      </div>

      {showAdd && <AddUserModal onCancel={() => setShowAdd(false)} onSubmit={handleAdd} busy={busyId === 'new'} />}
      {tempPasswordFor && <TempPasswordModal info={tempPasswordFor} onClose={() => setTempPasswordFor(null)} />}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? C.red : C.green, color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.text}
        </div>
      )}
    </div>
  )
}

function money(cents) {
  if (cents == null) return 'Custom'
  return `$${(cents / 100).toLocaleString()}/mo`
}

const STATUS_LABEL = {
  no_subscription: 'No active subscription',
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
}
const STATUS_BADGE_COLOR = {
  no_subscription: '#9CA3AF', trialing: '#b87333', active: C.green,
  past_due: C.red, canceled: '#9CA3AF', unpaid: C.red,
}

function BillingPanel({ data, loading, busy, onSubscribe, onManage }) {
  if (loading || !data) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
  }

  const { org, plan, seatsUsed, plans } = data
  const status = org?.subscription_status || 'no_subscription'
  const hasStripeSubscription = Boolean(org?.stripe_subscription_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Current plan</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>{plan?.name || 'No plan'}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              {seatsUsed} seat{seatsUsed === 1 ? '' : 's'} used{plan?.seat_limit ? ` of ${plan.seat_limit}` : ' (unlimited)'}
            </div>
            {org?.current_period_end && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {status === 'trialing' ? 'Trial ends' : 'Renews'} {new Date(org.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
            color: '#fff', background: STATUS_BADGE_COLOR[status] || '#9CA3AF',
          }}>
            {STATUS_LABEL[status] || status}
          </span>
        </div>

        {status === 'past_due' && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#FDECEC', borderRadius: 8, fontSize: 13, color: C.red }}>
            Your last payment failed. Update your payment method to avoid interruption — training access isn't currently affected, but this should be resolved.
          </div>
        )}

        {hasStripeSubscription && (
          <button onClick={onManage} disabled={busy}
            style={{ marginTop: 16, padding: '9px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            Manage Billing (Stripe)
          </button>
        )}
      </div>

      {!hasStripeSubscription && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 10 }}>Available plans</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {(plans || []).map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, color: C.gold }}>{p.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, margin: '6px 0' }}>{money(p.monthly_price_cents)}</div>
                <div style={{ fontSize: 12, color: '#6B7280', minHeight: 32 }}>{p.description}</div>
                {p.stripe_price_id ? (
                  <button onClick={() => onSubscribe(p.id)} disabled={busy}
                    style={{ marginTop: 12, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: C.communicateiqRed, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                    Subscribe
                  </button>
                ) : (
                  <a href="mailto:sales@communicateiq.example"
                    style={{ display: 'block', marginTop: 12, textAlign: 'center', padding: '8px 0', borderRadius: 8, border: '1px solid #D1D5DB', color: C.gold, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    Contact Sales
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SsoPanel({ data, loading, busy, form, setForm, onSave }) {
  if (loading || !data) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
  }

  const { availableProviders } = data

  if (!availableProviders?.length) {
    return (
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6 }}>No SSO provider configured</div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          This deployment doesn't have Azure AD, Okta, or Google Workspace credentials set up yet.
          Add them as environment variables (see DEPLOY.md), redeploy, then come back here to turn SSO on for your organization.
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: 480 }}>
      <div style={{ fontWeight: 700, color: C.gold, marginBottom: 4 }}>Single Sign-On</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
        SSO only authenticates people who already have an account here — turning this on doesn't grant access to anyone new by itself. Add users via the Users tab first.
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
        Enable SSO for this organization
      </label>

      <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Identity provider</label>
      <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13 }}>
        {availableProviders.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Required email domain</label>
      <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="acme.edu"
        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13 }} />
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: -8, marginBottom: 12 }}>
        Only sign-ins from this email domain will be accepted for your org, even if someone else's account matches.
      </div>

      {form.provider === 'azure-ad' && (
        <>
          <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
            Azure AD tenant ID <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional, extra verification)</span>
          </label>
          <input value={form.tenantId} onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))} placeholder="00000000-0000-0000-0000-000000000000"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13 }} />
        </>
      )}

      <button onClick={onSave} disabled={busy}
        style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.communicateiqRed, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Saving…' : 'Save SSO Settings'}
      </button>
    </div>
  )
}

function AddUserModal({ onCancel, onSubmit, busy }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('learner')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 360 }}>
        <div style={{ fontWeight: 700, color: C.gold, marginBottom: 16, fontSize: 15 }}>Add User</div>
        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13 }} />
        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13 }} />
        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 20, fontSize: 13 }}>
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button
            disabled={busy || !email || !name}
            onClick={() => onSubmit({ email, name, role })}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: C.communicateiqRed, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TempPasswordModal({ info, onClose }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 380 }}>
        <div style={{ fontWeight: 700, color: C.gold, marginBottom: 4, fontSize: 15 }}>Temporary Password</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
          For {info.name} ({info.email}). This is shown once — copy it now and hand it to them out of band (not email or Slack in plaintext).
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 16, fontWeight: 700, background: '#F8F9FB',
          border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px', textAlign: 'center',
          letterSpacing: 1, marginBottom: 14, color: C.gold,
        }}>
          {info.password}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={() => { navigator.clipboard?.writeText(info.password); setCopied(true) }}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <button onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: C.communicateiqRed, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
