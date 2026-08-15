import { decode, getToken } from 'next-auth/jwt';
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

    // Extract raw session token string from Next.js 15 RequestCookies
    const rawToken =
        req.cookies.get('__Secure-next-auth.session-token')?.value ||
        req.cookies.get('next-auth.session-token')?.value;

    let token = null;

    if (rawToken) {
        try {
            token = await decode({
                token: rawToken,
                secret: NEXTAUTH_SECRET,
            });
        } catch (err) {
            console.error('Failed to decode session token string:', err);
        }
    }

    // Fallback: try standard getToken methods
    if (!token) {
        token = await getToken({
            req,
            secret: NEXTAUTH_SECRET,
            secureCookie: true,
            cookieName: '__Secure-next-auth.session-token',
        });
    }

    if (!token) {
        token = await getToken({
            req,
            secret: NEXTAUTH_SECRET,
            secureCookie: false,
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
