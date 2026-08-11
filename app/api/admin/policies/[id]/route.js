import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { deletePolicyDocument } from '../../../../../lib/policies'

const UPLOAD_ROLES = ['content_author', 'content_approver', 'org_admin', 'corporate_admin']

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UPLOAD_ROLES.some(r => session.user.role === r || session.user.roles?.includes(r))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!session.user.orgId) return Response.json({ error: 'No organization on this session' }, { status: 400 })

  try {
    await deletePolicyDocument(session.user.orgId, params.id)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Delete policy document error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
