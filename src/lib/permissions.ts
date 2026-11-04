import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { NextResponse } from 'next/server';

export interface UserPermissionProfile {
    role?: string | null;
    email?: string | null;
}

/**
 * Memeriksa apakah user merupakan User Khusus (Super Admin)
 * yang memiliki seluruh akses pada setiap menu.
 */
export function isSuperAdminUser(user?: UserPermissionProfile | null): boolean {
    if (!user) return false;
    const role = user.role?.toUpperCase();
    const email = user.email?.toLowerCase().trim();
    return role === 'SUPERADMIN' || email === 'superadmin@lps.pekanbaru.go.id';
}

/**
 * Hook client-side untuk menentukan hak akses user aktif
 */
export function usePermissions() {
    const { data: session, status } = useSession();
    const user = session?.user as (UserPermissionProfile & { name?: string | null; id?: string | null }) | undefined;

    const isSuperAdmin = isSuperAdminUser(user);
    const isReadOnly = !isSuperAdmin;

    return {
        user,
        loading: status === 'loading',
        isAuthenticated: !!session?.user,
        isSuperAdmin,
        isReadOnly,
        canModify: isSuperAdmin, // Hanya user khusus yang memiliki akses modifikasi/tambah/edit/hapus
    };
}

/**
 * Guard backend untuk memastikan request mutasi (POST, PUT, PATCH, DELETE)
 * hanya dapat dijalankan oleh User Khusus (Super Admin).
 */
export async function requireSuperAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Unauthorized: Silakan login terlebih dahulu.' },
                { status: 401 }
            ),
        };
    }

    const isSuper = isSuperAdminUser(session.user as UserPermissionProfile);

    if (!isSuper) {
        return {
            authorized: false,
            response: NextResponse.json(
                {
                    error: 'Akses ditolak: Akun Anda hanya bersifat Read-Only. Tindakan penambahan, perubahan, atau penghapusan data hanya diizinkan untuk User Khusus (Nisa).',
                },
                { status: 403 }
            ),
        };
    }

    return { authorized: true, session };
}

