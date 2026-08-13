'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { C, INDUSTRIES, TRAINING_TYPES } from '../../lib/data'
import TeamPanel from './TeamPanel'
import ReviewsPanel from './ReviewsPanel'

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

// fetch() from a Netlify function that times out or crashes before returning
// JSON hands back an HTML error page, not a JSON error body — res.json()
// then throws its own confusing "Unexpected token '<'" instead of the real
// problem. Parse defensively so the toast says something a person can act on.
async function parseJsonResponse(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    if (res.status === 504 || res.status === 502) {
      throw new Error('The server took too long to respond (this can happen with larger documents or more scenarios) — try again with fewer source documents or fewer content types at once.')
    }
    throw new Error(`Server returned an unexpected response (status ${res.status}). Try again in a moment.`)
  }
}

// useSearchParams (used to support the /admin?tab=policies deep link from
// the home page's "Upload Your Policies" tile) requires a Suspense boundary
// around anything that calls it, or Next.js bails out of prerendering the
// route entirely — see the export default wrapper at the bottom of this file.
function AdminConsole() {
  const { data: session, status } = useSession()
  const CONTENT_ROLES = ['content_author', 'content_approver', 'org_admin', 'corporate_admin']
  const REVIEWER_ROLES_CLIENT = ['content_approver', 'org_admin', 'corporate_admin']
  const TEAM_VIEW_ROLES_CLIENT = ['manager', 'org_admin', 'corporate_admin']
  const canManagePolicies = CONTENT_ROLES.includes(session?.user?.role)
  const canReviewPolicies = REVIEWER_ROLES_CLIENT.includes(session?.user?.role)
  const isTeamViewer = TEAM_VIEW_ROLES_CLIENT.includes(session?.user?.role)
  const isOrgAdmin = ['org_admin', 'corporate_admin'].includes(session?.user?.role)
  const searchParams = useSearchParams()
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
  const forbidden = !loading && !isOrgAdmin && !canManagePolicies && !isTeamViewer && !canReviewPolicies
  const [showAdd, setShowAdd] = useState(false)
  const [tempPasswordFor, setTempPasswordFor] = useState(null) // { name, email, password }
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [orgUnits, setOrgUnits] = useState([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [assignmentBusy, setAssignmentBusy] = useState(false)

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then(async res => {
        if (res.status === 403) {
          // Not org_admin+, so /users is off-limits — but they may still
          // have content_author/content_approver access to Policies. Only
          // show the hard "forbidden" lock screen if they have neither.
          setLoading(false)
          return
        }
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
    if (status !== 'authenticated' || loading) return
    // A direct link (e.g. the redirect stubs at /team and /reviews, or the
    // old /admin?tab=policies deep link) always wins over the role-based
    // default — someone clicked something specific, don't second-guess it.
    const requestedTab = searchParams.get('tab')
    if (requestedTab === 'policies' && canManagePolicies) { setTab('policies'); return }
    if (requestedTab === 'team' && isTeamViewer) { setTab('team'); return }
    if (requestedTab === 'reviews' && canReviewPolicies) { setTab('reviews'); return }
    if (!isOrgAdmin && canManagePolicies) setTab('policies')
    else if (!isOrgAdmin && !canManagePolicies && isTeamViewer) setTab('team')
    else if (!isOrgAdmin && !canManagePolicies && !isTeamViewer && canReviewPolicies) setTab('reviews')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, loading])

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

  const loadAssignments = () => {
    setAssignmentsLoading(true)
    Promise.all([
      fetch('/api/admin/assignments').then(res => res.json()),
      fetch('/api/admin/cohorts').then(res => res.json()),
      fetch('/api/admin/org-units').then(res => res.json()),
    ])
      .then(([a, c, o]) => {
        setAssignments(a.assignments || [])
        setCohorts(c.cohorts || [])
        setOrgUnits(o.orgUnits || [])
      })
      .catch(() => {})
      .finally(() => setAssignmentsLoading(false))
  }

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'assignments') return
    loadAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, tab])

  async function handleCreateAssignment(form) {
    setAssignmentBusy(true)
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Failed to create assignment')
      setShowCreateAssignment(false)
      setToast({ type: 'success', text: 'Assignment created.' })
      loadAssignments()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setAssignmentBusy(false)
    }
  }

  async function handleCancelAssignment(id) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/assignments/${id}`, { method: 'DELETE' })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Failed to cancel assignment')
      setToast({ type: 'success', text: 'Assignment cancelled.' })
      loadAssignments()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreateCohort(name, memberUserIds) {
    setAssignmentBusy(true)
    try {
      const res = await fetch('/api/admin/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, memberUserIds }),
      })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Failed to create cohort')
      setToast({ type: 'success', text: `Cohort "${name}" created.` })
      loadAssignments()
      return data.cohort
    } catch (err) {
      setToast({ type: 'error', text: err.message })
      return null
    } finally {
      setAssignmentBusy(false)
    }
  }

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

  // ── Policies (org policy documents + AI-generated content) ────────────────
  const [policyDocs, setPolicyDocs] = useState([])
  const [policyDocsLoading, setPolicyDocsLoading] = useState(false)
  const [policyUploading, setPolicyUploading] = useState(false)
  const [drafts, setDrafts] = useState({ scenarios: [], moduleConfig: [] })
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draftBusyId, setDraftBusyId] = useState(null)

  const loadPolicyDocs = () => {
    setPolicyDocsLoading(true)
    fetch('/api/admin/policies')
      .then(async res => {
        const data = await parseJsonResponse(res)
        if (!res.ok) throw new Error(data.error || 'Failed to load documents')
        setPolicyDocs(data.documents || [])
      })
      .catch(err => setToast({ type: 'error', text: err.message }))
      .finally(() => setPolicyDocsLoading(false))
  }

  const loadDrafts = () => {
    if (!REVIEWER_ROLES_CLIENT.includes(session?.user?.role)) return
    setDraftsLoading(true)
    fetch('/api/admin/policies/drafts')
      .then(async res => {
        const data = await parseJsonResponse(res)
        if (!res.ok) throw new Error(data.error || 'Failed to load drafts')
        setDrafts({ scenarios: data.scenarios || [], moduleConfig: data.moduleConfig || [] })
      })
      .catch(err => setToast({ type: 'error', text: err.message }))
      .finally(() => setDraftsLoading(false))
  }

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'policies' || !canManagePolicies) return
    loadPolicyDocs()
    loadDrafts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, tab])

  // Documents still in status='processing' won't have extracted_text yet —
  // poll briefly so the list flips to "Ready" without the user refreshing.
  useEffect(() => {
    if (tab !== 'policies') return
    if (!policyDocs.some(d => d.status === 'processing')) return
    const t = setTimeout(loadPolicyDocs, 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, policyDocs])

  async function handleUploadPolicy(file) {
    setPolicyUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/policies', { method: 'POST', body: formData })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setToast({ type: 'success', text: `${file.name} uploaded.` })
      loadPolicyDocs()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setPolicyUploading(false)
    }
  }

  async function handleDeletePolicy(docId) {
    if (!confirm('Delete this document? Any drafts already generated from it are kept.')) return
    try {
      const res = await fetch(`/api/admin/policies/${docId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { loadPolicyDocs(); return }

      // The document has generated scenarios/config linked to it (draft,
      // approved, or archived) — offer to remove that content too rather
      // than dead-ending with a raw error.
      if (data.linkedCount) {
        const also = confirm(
          `${data.error}\n\n${data.linkedCount} linked item${data.linkedCount === 1 ? '' : 's'} found. Delete the document AND everything generated from it? This can't be undone.`
        )
        if (!also) return
        const res2 = await fetch(`/api/admin/policies/${docId}?cascade=true`, { method: 'DELETE' })
        const data2 = await res2.json()
        if (!res2.ok) throw new Error(data2.error || 'Delete failed')
        setToast({ type: 'success', text: 'Document and linked content deleted.' })
        loadPolicyDocs()
        return
      }

      throw new Error(data.error || 'Delete failed')
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    }
  }

  async function handleGenerate(form) {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/policies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      const n = (data.results?.scenarios?.length || 0) + (data.results?.financial ? 1 : 0) + (data.results?.qbr ? 1 : 0)
      setToast({ type: 'success', text: `Generated ${n} draft item${n === 1 ? '' : 's'} — review below before it reaches trainees.` })
      loadDrafts()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setGenerating(false)
    }
  }

  async function handleReviewScenario(id, action) {
    setDraftBusyId(id)
    try {
      const res = await fetch(`/api/admin/policies/scenarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update draft')
      loadDrafts()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setDraftBusyId(null)
    }
  }

  async function handleReviewModuleConfig(id, action) {
    setDraftBusyId(id)
    try {
      const res = await fetch(`/api/admin/policies/module-config/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update draft')
      loadDrafts()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
    } finally {
      setDraftBusyId(null)
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
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 18 }}>The Admin Console is restricted to org_admin accounts and above, manager accounts (Team tab), or content_author/content_approver (Content Upload / Reviews tabs).</div>
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            ...(isOrgAdmin ? ['users', 'assignments', 'activity', 'billing', 'sso'] : []),
            ...(isTeamViewer ? ['team'] : []),
            ...(canReviewPolicies ? ['reviews'] : []),
            ...(canManagePolicies ? ['policies'] : []),
          ].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: tab === t ? C.gold : '#fff', color: tab === t ? '#fff' : C.gold,
              }}>
              {t === 'users' ? 'Users' : t === 'assignments' ? 'Assignments' : t === 'activity' ? 'Sign-In Activity' : t === 'billing' ? 'Billing' : t === 'sso' ? 'SSO' : t === 'team' ? 'Team' : t === 'reviews' ? 'Reviews' : 'Content Upload'}
            </button>
          ))}
        </div>

        {tab === 'users' && isOrgAdmin && (
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

        {tab === 'assignments' && (
          <AssignmentsPanel
            assignments={assignments}
            cohorts={cohorts}
            orgUnits={orgUnits}
            users={users}
            loading={assignmentsLoading}
            busyId={busyId}
            onCreate={() => setShowCreateAssignment(true)}
            onCancel={handleCancelAssignment}
          />
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

        {tab === 'team' && isTeamViewer && <TeamPanel />}

        {tab === 'reviews' && canReviewPolicies && <ReviewsPanel />}

        {tab === 'policies' && (
          <PoliciesPanel
            docs={policyDocs}
            docsLoading={policyDocsLoading}
            uploading={policyUploading}
            onUpload={handleUploadPolicy}
            onDelete={handleDeletePolicy}
            drafts={drafts}
            draftsLoading={draftsLoading}
            canReview={canReviewPolicies}
            generating={generating}
            onGenerate={handleGenerate}
            draftBusyId={draftBusyId}
            onReviewScenario={handleReviewScenario}
            onReviewModuleConfig={handleReviewModuleConfig}
          />
        )}
      </div>

      {showAdd && <AddUserModal onCancel={() => setShowAdd(false)} onSubmit={handleAdd} busy={busyId === 'new'} />}
      {showCreateAssignment && (
        <CreateAssignmentModal
          users={users}
          orgUnits={orgUnits}
          cohorts={cohorts}
          busy={assignmentBusy}
          onCancel={() => setShowCreateAssignment(false)}
          onSubmit={handleCreateAssignment}
          onCreateCohort={handleCreateCohort}
        />
      )}
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

// ─── Assignments tab ─────────────────────────────────────────────────────────
// Kept in sync with lib/assignments.js's ASSIGNABLE_MODULE_KEYS — only the
// three modules that currently persist a simulation_attempts row at all
// (Financial/Stakeholder/Diagnostic don't call /api/results yet).
const MODULE_OPTIONS = [
  { key: 'simulation', label: 'Client Role-Play Simulation' },
  { key: 'leadership', label: 'Leadership Simulation' },
  { key: 'qbr', label: 'QBR Delivery' },
]
const MODULE_LABEL = Object.fromEntries(MODULE_OPTIONS.map(m => [m.key, m.label]))

function fmtDueDate(iso) {
  if (!iso) return 'No due date'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function AssignmentsPanel({ assignments, cohorts, orgUnits, users, loading, busyId, onCreate, onCancel }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={onCreate}
          style={{ background: C.communicateiqRed, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + New Assignment
        </button>
      </div>

      {loading && <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>}

      {!loading && !assignments.length && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          No assignments yet. Create one to assign Simulation, Leadership, or QBR training to a person, org unit, or cohort with a due date and passing score.
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {assignments.map(a => {
          const pct = a.progress.total ? Math.round((a.progress.complete / a.progress.total) * 100) : 0
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.gold, fontSize: 14 }}>{a.trackName}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    {(a.moduleItems || a.moduleKeys.map(moduleKey => ({ moduleKey, scenarioTitles: [] }))).map(m =>
                      m.scenarioTitles?.length
                        ? `${MODULE_LABEL[m.moduleKey] || m.moduleKey} (${m.scenarioTitles.join(', ')})`
                        : MODULE_LABEL[m.moduleKey] || m.moduleKey
                    ).join(' · ')}
                  </div>
                  <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>
                    Target: <strong>{a.target}</strong> · Due: {fmtDueDate(a.dueAt)}
                    {a.passingScore != null && <> · Passing: {a.passingScore}%</>}
                  </div>
                </div>
                <button onClick={() => onCancel(a.id)} disabled={busyId === a.id}
                  style={{ fontSize: 12, background: 'none', border: '1px solid #F0B8B8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: C.red, whiteSpace: 'nowrap' }}>
                  {busyId === a.id ? 'Cancelling…' : 'Cancel'}
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#F0F1F3' }}>
                  {a.progress.certified > 0 && <div style={{ width: `${(a.progress.certified / a.progress.total) * 100}%`, background: C.green }} />}
                  {a.progress.needsCoaching > 0 && <div style={{ width: `${(a.progress.needsCoaching / a.progress.total) * 100}%`, background: '#b87333' }} />}
                </div>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 6 }}>
                  <strong style={{ color: '#374151' }}>{a.progress.complete}/{a.progress.total}</strong> complete ({pct}%)
                  {a.progress.certified > 0 && <> · <span style={{ color: C.green }}>{a.progress.certified} certified</span></>}
                  {a.progress.needsCoaching > 0 && <> · <span style={{ color: '#b87333' }}>{a.progress.needsCoaching} need coaching</span></>}
                  {a.progress.incomplete > 0 && <> · <span style={{ color: '#9CA3AF' }}>{a.progress.incomplete} incomplete</span></>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Mirrors lib/assignments.js's SCENARIO_PICKABLE_MODULE_KEYS — kept as a
// separate constant here since that file pulls in server-only Supabase code
// and can't be imported from a client component. QBR has no scenario picker
// (single fixed build-and-deliver flow), so it's excluded.
const SCENARIO_PICKABLE_MODULE_KEYS = ['simulation', 'leadership']

function CreateAssignmentModal({ users, orgUnits, cohorts, busy, onCancel, onSubmit, onCreateCohort }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleKeys, setModuleKeys] = useState([])
  const [scenariosByModule, setScenariosByModule] = useState({}) // moduleKey -> scenario[] from /api/scenarios, fetched lazily
  const [scenariosLoading, setScenariosLoading] = useState({}) // moduleKey -> bool
  const [selectedScenarios, setSelectedScenarios] = useState({}) // moduleKey -> Set(scenarioFamilyId)
  const [targetType, setTargetType] = useState('user')
  const [targetId, setTargetId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [passingScore, setPassingScore] = useState('')
  const [showNewCohort, setShowNewCohort] = useState(false)
  const [newCohortName, setNewCohortName] = useState('')
  const [newCohortMembers, setNewCohortMembers] = useState([])

  function toggleModule(key) {
    setModuleKeys(m => {
      const next = m.includes(key) ? m.filter(k => k !== key) : [...m, key]
      // Fetch that module's scenario list the first time it's checked, so
      // the "require specific scenarios" picker has something to show.
      if (next.includes(key) && SCENARIO_PICKABLE_MODULE_KEYS.includes(key) && !scenariosByModule[key] && !scenariosLoading[key]) {
        setScenariosLoading(l => ({ ...l, [key]: true }))
        fetch(`/api/scenarios?set=${key === 'leadership' ? 'leadership' : 'client'}`)
          .then(res => res.json())
          .then(data => setScenariosByModule(s => ({ ...s, [key]: data.scenarios || [] })))
          .catch(() => setScenariosByModule(s => ({ ...s, [key]: [] })))
          .finally(() => setScenariosLoading(l => ({ ...l, [key]: false })))
      }
      return next
    })
  }

  function toggleScenario(moduleKey, familyId) {
    if (!familyId) return
    setSelectedScenarios(s => {
      const current = new Set(s[moduleKey] || [])
      current.has(familyId) ? current.delete(familyId) : current.add(familyId)
      return { ...s, [moduleKey]: current }
    })
  }

  async function handleCreateCohortInline() {
    if (!newCohortName.trim()) return
    const cohort = await onCreateCohort(newCohortName.trim(), newCohortMembers)
    if (cohort) {
      setTargetId(cohort.id)
      setShowNewCohort(false)
      setNewCohortName('')
      setNewCohortMembers([])
    }
  }

  const canSubmit = name.trim() && moduleKeys.length > 0 && targetId

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 440, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, color: C.gold, marginBottom: 16, fontSize: 15 }}>New Assignment</div>

        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="FY27 Client Retention Training"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13 }} />

        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Description <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />

        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Required modules</label>
        <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
          {MODULE_OPTIONS.map(m => {
            const checked = moduleKeys.includes(m.key)
            const pickable = checked && SCENARIO_PICKABLE_MODULE_KEYS.includes(m.key)
            const scenarios = scenariosByModule[m.key] || []
            const selected = selectedScenarios[m.key] || new Set()
            return (
              <div key={m.key}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleModule(m.key)} />
                  {m.label}
                </label>
                {pickable && (
                  <div style={{ marginLeft: 24, marginTop: 6, marginBottom: 4, padding: 10, background: '#F8F9FB', borderRadius: 8 }}>
                    <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 6 }}>
                      Require specific scenarios <span style={{ color: '#9CA3AF' }}>(optional — leave unchecked for any scenario)</span>
                    </div>
                    {scenariosLoading[m.key] ? (
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Loading scenarios…</div>
                    ) : !scenarios.length ? (
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>No scenarios available for this module yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                        {scenarios.map(s => (
                          <label key={s.scenarioFamilyId || s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: s.scenarioFamilyId ? 'pointer' : 'default', opacity: s.scenarioFamilyId ? 1 : 0.5 }}>
                            <input
                              type="checkbox"
                              disabled={!s.scenarioFamilyId}
                              checked={selected.has(s.scenarioFamilyId)}
                              onChange={() => toggleScenario(m.key, s.scenarioFamilyId)}
                            />
                            <span style={{ color: '#374151' }}>{s.title}</span>
                            <span style={{ color: '#9CA3AF', fontSize: 11 }}>
                              — {INDUSTRIES.find(i => i.id === s.industry)?.label || s.industry}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Assign to</label>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 12 }}>
          {[['user', 'Person'], ['org_unit', 'Org unit (+ reports)'], ['cohort', 'Cohort']].map(([id, label]) => (
            <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="radio" checked={targetType === id} onChange={() => { setTargetType(id); setTargetId('') }} />
              {label}
            </label>
          ))}
        </div>

        {targetType === 'user' && (
          <select value={targetId} onChange={e => setTargetId(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 14, fontSize: 13 }}>
            <option value="">Select a person…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        )}

        {targetType === 'org_unit' && (
          <select value={targetId} onChange={e => setTargetId(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 14, fontSize: 13 }}>
            <option value="">Select an org unit…</option>
            {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}

        {targetType === 'cohort' && (
          <div style={{ marginBottom: 14 }}>
            <select value={targetId} onChange={e => setTargetId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 8, fontSize: 13 }}>
              <option value="">Select a cohort…</option>
              {cohorts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.memberCount} members)</option>)}
            </select>
            {!showNewCohort ? (
              <button onClick={() => setShowNewCohort(true)} type="button"
                style={{ fontSize: 12, background: 'none', border: 'none', color: C.gold, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                + Create a new cohort
              </button>
            ) : (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, marginTop: 6 }}>
                <input value={newCohortName} onChange={e => setNewCohortName(e.target.value)} placeholder="Cohort name"
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 8, fontSize: 12 }} />
                <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8, border: '1px solid #EEF0F3', borderRadius: 6, padding: 6 }}>
                  {users.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newCohortMembers.includes(u.id)}
                        onChange={() => setNewCohortMembers(m => m.includes(u.id) ? m.filter(x => x !== u.id) : [...m, u.id])} />
                      {u.name}
                    </label>
                  ))}
                </div>
                <button onClick={handleCreateCohortInline} disabled={busy || !newCohortName.trim()} type="button"
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: 'none', background: C.communicateiqRed, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Create Cohort
                </button>
              </div>
            )}
          </div>
        )}

        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Due date <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
        <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 12, fontSize: 13 }} />

        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Passing score % <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional — leave blank to count completion alone as certified)</span></label>
        <input type="number" min="0" max="100" value={passingScore} onChange={e => setPassingScore(e.target.value)} placeholder="80"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', marginBottom: 20, fontSize: 13 }} />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button
            disabled={busy || !canSubmit}
            onClick={() => onSubmit({
              name: name.trim(),
              description: description.trim() || null,
              moduleItems: moduleKeys.map(moduleKey => ({
                moduleKey,
                scenarioFamilyIds: [...(selectedScenarios[moduleKey] || [])],
              })),
              targetType,
              targetId,
              dueAt: dueAt ? new Date(dueAt).toISOString() : null,
              passingScore: passingScore !== '' ? Number(passingScore) : null,
            })}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: C.communicateiqRed, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy || !canSubmit ? 0.6 : 1 }}>
            {busy ? 'Creating…' : 'Create Assignment'}
          </button>
        </div>
      </div>
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

// ─── Policies tab ────────────────────────────────────────────────────────────

const STATUS_DOT = { processing: '#b87333', processed: C.green, error: C.red }
const STATUS_TEXT = { processing: 'Processing…', processed: 'Ready', error: 'Error' }
const ACCEPTED_EXT = '.pdf,.docx,.txt,.md'

function fmtBytesFilename(name) {
  return name.length > 44 ? name.slice(0, 41) + '…' : name
}

function PoliciesPanel({
  docs, docsLoading, uploading, onUpload, onDelete,
  drafts, draftsLoading, canReview, generating, onGenerate, draftBusyId,
  onReviewScenario, onReviewModuleConfig,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [industryId, setIndustryId] = useState(INDUSTRIES[0].id)
  const [serviceLine, setServiceLine] = useState('dining')
  const [selectedDocIds, setSelectedDocIds] = useState([])
  const [targets, setTargets] = useState({ scenarios: true, financial: false, qbr: false })

  const industryTrainingTypes = TRAINING_TYPES[industryId] || []
  const nonFacilitiesType = industryTrainingTypes.find(t => !t.id.startsWith('facilities-'))
  const trainingType = serviceLine === 'dining' ? (nonFacilitiesType?.id || industryTrainingTypes[0]?.id) : serviceLine

  const processedDocs = docs.filter(d => d.status === 'processed')
  const totalDrafts = drafts.scenarios.length + drafts.moduleConfig.length

  function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    files.forEach(f => onUpload(f))
  }

  function toggleDoc(id) {
    setSelectedDocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function submitGenerate() {
    const chosenTargets = Object.entries(targets).filter(([, v]) => v).map(([k]) => k)
    if (!selectedDocIds.length) return
    if (!chosenTargets.length) return
    onGenerate({ documentIds: selectedDocIds, industryId, serviceLine, trainingType, targets: chosenTargets })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Upload */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 4 }}>Your Organization's Policies & Procedures</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
          Upload your own policy and procedure documents. The AI can generate training scenarios, rubric criteria, and Financial/QBR coaching content grounded in your organization's actual language — nothing generated here reaches trainees until you approve it below.
        </div>

        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: `2px dashed ${dragOver ? C.communicateiqRed : '#D1D5DB'}`, borderRadius: 10,
            padding: '28px 16px', cursor: 'pointer', background: dragOver ? '#FFF7F5' : '#FAFAFB',
            marginBottom: 14, transition: 'background 0.15s, border-color 0.15s',
          }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.gold, marginBottom: 2 }}>
            {uploading ? 'Uploading…' : 'Drop a policy document here, or click to browse'}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>PDF, Word (.docx), plain text, or markdown — up to 8MB</div>
          <input
            type="file" accept={ACCEPTED_EXT} multiple disabled={uploading}
            onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            style={{ display: 'none' }}
          />
        </label>

        {docsLoading ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading documents…</div>
        ) : !docs.length ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No policy documents uploaded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {docs.map(d => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                background: '#F8F9FB', borderRadius: 8, fontSize: 13,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[d.status] || '#9CA3AF', flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#374151', fontWeight: 600 }}>{fmtBytesFilename(d.filename)}</span>
                <span style={{ color: d.status === 'error' ? C.red : '#9CA3AF', fontSize: 12 }}>
                  {d.status === 'error' && d.error_message ? d.error_message : STATUS_TEXT[d.status]}
                </span>
                <button onClick={() => onDelete(d.id)}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12, padding: 4 }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 4 }}>Generate Content From Policies</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
          Pick one or more processed documents, tell the AI which training track they apply to, and choose what to generate.
        </div>

        {!processedDocs.length ? (
          <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0' }}>
            Upload and wait for at least one document to finish processing before generating content.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Source documents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              {processedDocs.map(d => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDocIds.includes(d.id)} onChange={() => toggleDoc(d.id)} />
                  {fmtBytesFilename(d.filename)}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Industry</div>
                <select value={industryId} onChange={e => setIndustryId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}>
                  {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Service line</div>
                <select value={serviceLine} onChange={e => setServiceLine(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}>
                  <option value="dining">{nonFacilitiesType?.label || 'Core Track'}</option>
                  <option value="facilities-maintenance">Facilities — Maintenance</option>
                  <option value="facilities-housekeeping">Facilities — Housekeeping</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Generate</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={targets.scenarios} onChange={e => setTargets(t => ({ ...t, scenarios: e.target.checked }))} />
                Scenarios & Rubrics
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={targets.financial} onChange={e => setTargets(t => ({ ...t, financial: e.target.checked }))} />
                Financial Storytelling
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={targets.qbr} onChange={e => setTargets(t => ({ ...t, qbr: e.target.checked }))} />
                QBR Coaching
              </label>
            </div>

            <button
              onClick={submitGenerate}
              disabled={generating || !selectedDocIds.length || !Object.values(targets).some(Boolean)}
              style={{
                background: C.communicateiqRed, color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 13, fontWeight: 700,
                cursor: generating ? 'default' : 'pointer',
                opacity: (generating || !selectedDocIds.length || !Object.values(targets).some(Boolean)) ? 0.5 : 1,
              }}>
              {generating ? 'Generating… (this can take a minute)' : 'Generate Draft Content'}
            </button>
          </>
        )}
      </div>

      {/* Review drafts */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 4 }}>Awaiting Review</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
          {canReview
            ? 'Nothing here reaches trainees until you approve it. Rejecting archives the draft.'
            : 'A content_approver, org_admin, or corporate_admin needs to approve these before trainees see them.'}
        </div>

        {draftsLoading ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading drafts…</div>
        ) : !totalDrafts ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No drafts waiting on review.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {drafts.scenarios.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8F9FB', borderRadius: 8, fontSize: 13, opacity: draftBusyId === s.id ? 0.5 : 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#6B7280', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>SCENARIO</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.industryId} · {s.trainingType} · {s.difficulty}</div>
                </div>
                {canReview && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button disabled={draftBusyId === s.id} onClick={() => onReviewScenario(s.id, 'approve')}
                      style={{ fontSize: 12, background: C.green, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      Approve
                    </button>
                    <button disabled={draftBusyId === s.id} onClick={() => onReviewScenario(s.id, 'reject')}
                      style={{ fontSize: 12, background: 'none', border: '1px solid #F0B8B8', color: C.red, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {drafts.moduleConfig.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8F9FB', borderRadius: 8, fontSize: 13, opacity: draftBusyId === c.id ? 0.5 : 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#1C2B5E', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                  {c.module === 'financial' ? 'FINANCIAL' : 'QBR'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>
                    {c.module === 'financial' ? 'Financial Storytelling config' : 'QBR coaching config'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.industryId} · {c.serviceLine}</div>
                </div>
                {canReview && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button disabled={draftBusyId === c.id} onClick={() => onReviewModuleConfig(c.id, 'approve')}
                      style={{ fontSize: 12, background: C.green, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      Approve
                    </button>
                    <button disabled={draftBusyId === c.id} onClick={() => onReviewModuleConfig(c.id, 'reject')}
                      style={{ fontSize: 12, background: 'none', border: '1px solid #F0B8B8', color: C.red, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminConsolePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray }}>Loading…</div>}>
      <AdminConsole />
    </Suspense>
  )
}
