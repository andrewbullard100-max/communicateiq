import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { uploadPolicyDocument, listPolicyDocuments } from '../../../../lib/policies'

// content_author can upload source material; approval of what gets
// generated from it is gated separately (see [id]/approve routes) and
// requires content_approver — same split of duties as scenario authoring.
const UPLOAD_ROLES = ['content_author', 'content_approver', 'org_admin', 'corporate_admin']

async function requireUploader() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!UPLOAD_ROLES.some(r => session.user.role === r || session.user.roles?.includes(r))) {
    return { error: Response.json({ error: 'Forbidden — content_author role or higher required' }, { status: 403 }) }
  }
  if (!session.user.orgId) return { error: Response.json({ error: 'No organization on this session' }, { status: 400 }) }
  return { session }
}

export async function GET() {
  const { session, error } = await requireUploader()
  if (error) return error
  try {
    const documents = await listPolicyDocuments(session.user.orgId)
    return Response.json({ documents })
  } catch (err) {
    console.error('List policy documents error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, error } = await requireUploader()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided.' }, { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const doc = await uploadPolicyDocument({
      orgId: session.user.orgId,
      uploadedBy: session.user.id,
      filename: file.name,
      mimeType: file.type,
      buffer,
    })
    return Response.json({ document: doc })
  } catch (err) {
    console.error('Upload policy document error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
