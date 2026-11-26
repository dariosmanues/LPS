import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NEXTAUTH_SECRET } from '@/lib/auth-secret';
import { extractHeadersInfo, logUserActivity } from '@/lib/user-activity-logger';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials, req) {
                console.log('Attempting login for:', credentials?.email);
                const { clientIp, userAgent } = extractHeadersInfo(req?.headers);
                if (!credentials?.email || !credentials?.password) {
                    console.log('Missing credentials');
                    return null;
                }

                let lookupEmail = credentials.email.toLowerCase().trim();
                if (!lookupEmail.includes('@')) {
                    if (lookupEmail === 'superadmin' || lookupEmail === 'nisa') lookupEmail = 'superadmin@lps.pekanbaru.go.id';
                    else if (lookupEmail === 'viewer') lookupEmail = 'viewer@lps.pekanbaru.go.id';
                    else if (lookupEmail === 'admin') lookupEmail = 'admin@lps.pekanbaru.go.id';
                    else if (lookupEmail === 'dzakwan') lookupEmail = 'dzakwan@lps.pekanbaru.go.id';
                    else if (lookupEmail === 'santi' || lookupEmail === 'santirahmayanti' || lookupEmail === 'santi rahmayanti' || lookupEmail === 'shanti') lookupEmail = 'santi.rahmayanti@lps.pekanbaru.go.id';
                    else if (lookupEmail === 'sal' || lookupEmail === 'salpriadi' || lookupEmail === 'sal priadi') lookupEmail = 'sal.priadi@lps.pekanbaru.go.id';
                }

                let user = await prisma.user.findUnique({
                    where: { email: lookupEmail },
                });

                if (!user) {
                    const normalized = credentials.email.toLowerCase().trim().replace(/[-_]/g, '');
                    user = await prisma.user.findUnique({
                        where: { email: normalized }
                    });
                }

                if (!user) {
                    // Try Sukamulia <-> Sukamulya fallback
                    if (credentials.email.includes('sukamulia')) {
                        user = await prisma.user.findUnique({
                            where: { email: credentials.email.toLowerCase().trim().replace('sukamulia', 'sukamulya') }
                        });
                    } else if (credentials.email.includes('sukamulya')) {
                        user = await prisma.user.findUnique({
                            where: { email: credentials.email.toLowerCase().trim().replace('sukamulya', 'sukamulia') }
                        });
                    }
                }

                if (!user) {
                    console.log('User not found:', credentials.email);
                    logUserActivity({
                        userEmail: credentials.email.toLowerCase().trim(),
                        action: 'LOGIN_FAILED',
                        category: 'AUTH',
                        description: `Gagal login: Email/username "${credentials.email}" tidak ditemukan`,
                        targetPath: '/login',
                        ipAddress: clientIp,
                        userAgent,
                        metadata: { reason: 'USER_NOT_FOUND', inputEmail: credentials.email },
                    });
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                console.log('Password check result:', isValidPassword);

                if (!isValidPassword) {
                    console.log('Invalid password for:', credentials.email);
                    logUserActivity({
                        userId: user.id,
                        userEmail: user.email,
                        userName: user.name,
                        userRole: user.role,
                        action: 'LOGIN_FAILED',
                        category: 'AUTH',
                        description: `Gagal login: Password salah untuk akun ${user.email} (${user.name})`,
                        targetPath: '/login',
                        ipAddress: clientIp,
                        userAgent,
                        metadata: { reason: 'INVALID_PASSWORD', inputEmail: credentials.email },
                    });
                    return null;
                }

                logUserActivity({
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name,
                    userRole: user.role,
                    action: 'LOGIN_SUCCESS',
                    category: 'AUTH',
                    description: `Login berhasil ke sistem sebagai ${user.name} (${user.role})`,
                    targetPath: '/login',
                    ipAddress: clientIp,
                    userAgent,
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name ?? undefined,
                    role: user.role,
                    kelurahanId: user.kelurahanId,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const u = user as { role: string; kelurahanId?: string | null };
                token.role = u.role;
                token.id = user.id;
                token.kelurahanId = u.kelurahanId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string }).role = token.role as string;
                (session.user as { id?: string }).id = token.id as string;
                (session.user as { kelurahanId?: string | null }).kelurahanId = token.kelurahanId as string | null;

                // Sync with latest DB user data if token has id or email
                if (token.id || token.email) {
                    try {
                        const dbUser = await prisma.user.findFirst({
                            where: {
                                OR: [
                                    ...(token.id ? [{ id: token.id as string }] : []),
                                    ...(token.email ? [{ email: (token.email as string).toLowerCase() }] : []),
                                ],
                            },
                            select: { id: true, role: true, kelurahanId: true, name: true }
                        });
                        if (dbUser) {
                            (session.user as { id?: string }).id = dbUser.id;
                            (session.user as { role?: string }).role = dbUser.role;
                            (session.user as { kelurahanId?: string | null }).kelurahanId = dbUser.kelurahanId;
                            if (dbUser.name) session.user.name = dbUser.name;
                        }
                    } catch (e) {
                        console.error('[Session Callback] DB sync error:', e);
                    }
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: NEXTAUTH_SECRET,
};
