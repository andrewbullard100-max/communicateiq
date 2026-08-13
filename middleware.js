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

  // Role gating for the Admin Console — Team, Reviews, and Content Upload
  // (Policies) now live as tabs inside /admin instead of separate routes, so
  // this one gate covers everyone who can see at least one tab there: full
  // admins, managers (Team tab), and content roles (Content Upload/Reviews
  // tabs). The real security boundary is still the server-side role check in
  // each admin API route (see SECURITY.md); this redirect is the UX layer so
  // a learner never lands on the page at all. /team and /reviews are thin
  // client-side redirects into /admin?tab=..., so no separate gate is needed
  // for them.
  const ADMIN_AREA_ROLES = ['org_admin', 'corporate_admin', 'manager', 'content_author', 'content_approver']
  if (pathname.startsWith('/admin') && !ADMIN_AREA_ROLES.includes(token.role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|api/stripe/webhook|api/internal/purge-transcripts|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
  ],
}
