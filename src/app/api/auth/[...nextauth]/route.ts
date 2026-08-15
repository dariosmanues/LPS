import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'lps-secret-key-change-in-production';
}

if (process.env.VERCEL) {
    process.env.NEXTAUTH_URL = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://lps-flame.vercel.app';
} else if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
