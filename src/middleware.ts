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

    const secureCookie = req.cookies.get('__Secure-next-auth.session-token')?.value;
    const devCookie = req.cookies.get('next-auth.session-token')?.value;

    let token = null;

    // 1. Try decoding HTTPS secure cookie with salt '__Secure-next-auth.session-token'
    if (secureCookie) {
        try {
            token = await decode({
                token: secureCookie,
                secret: NEXTAUTH_SECRET,
                salt: '__Secure-next-auth.session-token',
            });
        } catch (err) {
            console.error('[Middleware] Secure token decode error:', err);
        }
    }

    // 2. Try decoding HTTP dev cookie with salt 'next-auth.session-token'
    if (!token && devCookie) {
        try {
            token = await decode({
                token: devCookie,
                secret: NEXTAUTH_SECRET,
                salt: 'next-auth.session-token',
            });
        } catch (err) {
            console.error('[Middleware] Dev token decode error:', err);
        }
    }

    // 3. Fallback: try standard getToken with explicit secureCookie boolean
    if (!token) {
        token = await getToken({
            req,
            secret: NEXTAUTH_SECRET,
            secureCookie: true,
        });
    }

    if (!token) {
        token = await getToken({
            req,
            secret: NEXTAUTH_SECRET,
            secureCookie: false,
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
