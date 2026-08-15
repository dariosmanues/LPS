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

    // 1. Try HTTPS production secure cookie
    let token = await getToken({
        req,
        secret: NEXTAUTH_SECRET,
        secureCookie: true,
        cookieName: '__Secure-next-auth.session-token',
    });

    // 2. Try HTTP development cookie
    if (!token) {
        token = await getToken({
            req,
            secret: NEXTAUTH_SECRET,
            secureCookie: false,
            cookieName: 'next-auth.session-token',
        });
    }

    // 3. Fallback: let NextAuth auto-detect cookie name and chunking
    if (!token) {
        token = await getToken({
            req,
            secret: NEXTAUTH_SECRET,
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
