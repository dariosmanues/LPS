import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const secret = process.env.NEXTAUTH_SECRET || 'lps-secret-key-change-in-production';

function isLpsRole(role: string): boolean {
    return ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(role);
}

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const isHttps = req.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';

    // Try reading token with both secure and non-secure cookie options to guarantee detection
    let token = await getToken({ req, secret, secureCookie: isHttps });
    if (!token && isHttps) {
        token = await getToken({ req, secret, secureCookie: false });
    }

    // Public routes that don't require authentication
    if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname.includes('/login')
    ) {
        // If user is already logged in and tries to access /login, redirect to their role dashboard
        if (token && (pathname === '/login' || pathname.endsWith('/login'))) {
            const userRole = token.role as string;
            if (userRole === 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            } else if (isLpsRole(userRole)) {
                return NextResponse.redirect(new URL('/lps', req.url));
            } else {
                return NextResponse.redirect(new URL('/scan', req.url));
            }
        }
        return NextResponse.next();
    }

    // Protected routes: require valid token
    if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', req.url);
        return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as string;

    // Dashboard routes - Admin only
    if (pathname.startsWith('/dashboard')) {
        if (userRole !== 'ADMIN') {
            if (isLpsRole(userRole)) {
                return NextResponse.redirect(new URL('/lps', req.url));
            }
            return NextResponse.redirect(new URL('/scan', req.url));
        }
    }

    // LPS routes - LPS roles only
    if (pathname.startsWith('/lps')) {
        if (!isLpsRole(userRole)) {
            if (userRole === 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
            return NextResponse.redirect(new URL('/scan', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - uploads (uploaded files)
         * - Static image files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
