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

    // Unauthenticated: redirect to login (use relative path so proxy localhost:3000 never leaks into callbackUrl)
    if (!token) {
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '177-202-246-42.sslip.io';
        const proto = req.headers.get('x-forwarded-proto') || 'https';
        const loginUrl = new URL('/login', `${proto}://${host}`);
        loginUrl.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
    }

    const userRole = (token.role as string)?.toUpperCase() || '';
    const userEmail = (token.email as string)?.toLowerCase() || '';
    const isSuperAdmin = userRole === 'SUPERADMIN' || userEmail === 'superadmin@lps.pekanbaru.go.id';

    // Dashboard & Notes routes:
    // Super Admin has full write access.
    // All other users can view all dashboard menus in Read-Only mode.
    if (pathname.startsWith('/dashboard') || pathname === '/notes') {
        // KHUSUS menu /dashboard/user-activity-logs & /dashboard/server-status: HANYA untuk fikri@lps.pekanbaru.go.id
        if (
            pathname.startsWith('/dashboard/user-activity-logs') ||
            pathname.startsWith('/dashboard/server-status')
        ) {
            if (userEmail !== 'fikri@lps.pekanbaru.go.id') {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }
        // Akun pengurus LPS Kelurahan selalu diarahkan ke Dashboard Kelurahan (/lps)
        if (pathname.startsWith('/dashboard') && isLpsRole(userRole)) {
            return NextResponse.redirect(new URL('/lps', req.url));
        }
        // Authenticated users are allowed into dashboard (handled with read-only badges/restrictions in UI & API)
        return NextResponse.next();
    }

    // LPS routes - LPS roles, Admin, and Super Admin can access
    if (pathname.startsWith('/lps')) {
        if (!isLpsRole(userRole) && !isSuperAdmin && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
