import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'lps-secret-key-change-in-production';
}

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
