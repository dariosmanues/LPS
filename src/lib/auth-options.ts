import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NEXTAUTH_SECRET } from '@/lib/auth-secret';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('Attempting login for:', credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    console.log('Missing credentials');
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    console.log('User not found:', credentials.email);
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                console.log('Password check result:', isValidPassword);

                if (!isValidPassword) {
                    console.log('Invalid password for:', credentials.email);
                    return null;
                }

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
                            where: token.id ? { id: token.id as string } : { email: token.email as string },
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
