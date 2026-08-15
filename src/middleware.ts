import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { NEXTAUTH_SECRET } from '@/lib/auth-secret';

function isLpsRole(role: string): boolean {
    return ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(role);
}

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Public routes: /, /login, any /[kelurahan]/login, and all /api/auth/*
    if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname.includes('/login') ||
        pathname.startsWith('/api/auth')
    ) {
        return NextResponse.next();
    }

    // Determine cookie name based on environment
    const isProd = process.env.NODE_ENV === 'production';
    const primaryCookieName = isProd
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

    // Try reading JWT token with explicit cookieName
    let token = await getToken({
        req,
        secret: NEXTAUTH_SECRET,
        cookieName: primaryCookieName,
    });

    // Fallback check for dev/HTTP cookie name if proxied in production or edge runtime
    if (!token && isProd) {
        token = await getToken({
            req,
            secret: NEXTAUTH_SECRET,
            cookieName: 'next-auth.session-token',
        });
    }

    // Unauthenticated: redirect to login
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
        '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
