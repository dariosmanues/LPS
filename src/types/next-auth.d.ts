import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            kelurahanId?: string | null;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        kelurahanId?: string | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        kelurahanId?: string | null;
    }
}

