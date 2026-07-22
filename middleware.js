import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Every route is protected by default. Unauthenticated page requests are
// redirected to /login; unauthenticated API requests get a 401 instead of a
// redirect (so client-side fetch calls fail cleanly rather than trying to
// parse an HTML login page as JSON).
export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role gating — the Team Dashboard is manager/org_admin/corporate_admin-
  // facing. The real security boundary is the server-side role check in
  // /api/results (a learner cannot read team data no matter what the client
  // requests); this redirect is the UX layer so a learner never lands on the
  // page at all.
  const TEAM_VIEW_ROLES = ['manager', 'org_admin', 'corporate_admin']
  if (pathname.startsWith('/team') && !TEAM_VIEW_ROLES.includes(token.role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const ADMIN_CONSOLE_ROLES = ['org_admin', 'corporate_admin']
  if (pathname.startsWith('/admin') && !ADMIN_CONSOLE_ROLES.includes(token.role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const REVIEWER_ROLES = ['content_approver', 'org_admin', 'corporate_admin']
  if (pathname.startsWith('/reviews') && !REVIEWER_ROLES.includes(token.role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|api/stripe/webhook|api/internal/purge-transcripts|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
  ],
}
