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

  // Role gating — the Team Dashboard is manager/admin-facing. The real
  // security boundary is the server-side role check in /api/results (a
  // trainee cannot read team data no matter what the client requests); this
  // redirect is the UX layer so a trainee never lands on the page at all.
  if (pathname.startsWith('/team') && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
  ],
}
