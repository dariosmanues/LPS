import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Helper to check if user is an LPS role
function isLpsRole(role: string): boolean {
    return ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(role);
}

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        // If logged in, apply role-based access control
        if (token) {
            const userRole = token.role as string;

            // Dashboard routes - Admin only
            if (pathname.startsWith('/dashboard')) {
                if (userRole !== 'ADMIN') {
                    // LPS users go to /lps
                    if (isLpsRole(userRole)) {
                        return NextResponse.redirect(new URL('/lps', req.url));
                    }
                    return NextResponse.redirect(new URL('/scan', req.url));
                }
            }

            // LPS routes - LPS roles only
            if (pathname.startsWith('/lps')) {
                if (!isLpsRole(userRole)) {
                    // Admin goes to dashboard
                    if (userRole === 'ADMIN') {
                        return NextResponse.redirect(new URL('/dashboard', req.url));
                    }
                    return NextResponse.redirect(new URL('/scan', req.url));
                }
            }

            // Redirect from login page if already logged in
            if (pathname === '/login' || pathname.endsWith('/login')) {
                if (userRole === 'ADMIN') {
                    return NextResponse.redirect(new URL('/dashboard', req.url));
                } else if (isLpsRole(userRole)) {
                    return NextResponse.redirect(new URL('/lps', req.url));
                } else {
                    return NextResponse.redirect(new URL('/scan', req.url));
                }
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname;

                // Allow access to login page without token
                if (pathname === '/login' || pathname.includes('/login')) {
                    return true;
                }

                // Require token for protected routes
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};


