import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check for the simulated auth cookie
  const authToken = request.cookies.get('auth_token')
  const adminToken = request.cookies.get('admin_token')
  const { pathname } = request.nextUrl

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!adminToken && pathname !== '/admin/auth') {
      return NextResponse.redirect(new URL('/admin/auth', request.url))
    }
    if (adminToken && pathname === '/admin/auth') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // If there's no auth token and the user is NOT on the auth page
  if (!authToken && !pathname.startsWith('/auth')) {
    // Redirect them to the auth page
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // If there IS an auth token and they try to go to the auth page
  if (authToken && pathname.startsWith('/auth')) {
    // Redirect them to the dashboard
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Otherwise, allow the request to proceed normally
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
