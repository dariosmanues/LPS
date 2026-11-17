import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { requireSuperAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { readFile, writeFile, mkdir, unlink, access, rename } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/**
 * Foto profil disimpan PER USER (berdasarkan user.id), bukan per role.
 * Dua akun SUPERADMIN (mis. Fikri & Nisa) memiliki foto masing-masing.
 *
 * File per user : public/uploads/avatars/<userId>.json
 * Default Nisa  : public/avatar-superadmin.png
 * Default lain  : SVG inisial nama
 */

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const AVATAR_DIR = join(UPLOAD_DIR, 'avatars');
// File lama (versi sebelumnya: satu foto bersama untuk semua SUPERADMIN)
const LEGACY_AVATAR_FILE = join(UPLOAD_DIR, 'superadmin-avatar.json');
const LEGACY_BACKUP_FILE = join(UPLOAD_DIR, 'superadmin-avatar.legacy-backup.json');
// Pemilik foto lama yang tersimpan di file bersama (foto terakhir diupload oleh Fikri)
const LEGACY_OWNER_EMAIL = 'fikri@lps.pekanbaru.go.id';
const NISA_EMAIL = 'superadmin@lps.pekanbaru.go.id';
const NISA_DEFAULT_AVATAR_FILE = join(process.cwd(), 'public', 'avatar-superadmin.png');

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
};

interface StoredAvatarData {
    mimeType: string;
    base64: string;
    updatedAt: string;
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

function sanitizeUserId(id: string): string | null {
    const clean = id.trim();
    return /^[a-zA-Z0-9_-]{1,64}$/.test(clean) ? clean : null;
}

function avatarFileFor(userId: string): string {
    return join(AVATAR_DIR, `${userId}.json`);
}

/**
 * Migrasi satu kali: file bersama lama dipindahkan menjadi foto milik pemiliknya
 * (Fikri), sehingga akun Nisa kembali ke foto miliknya sendiri.
 */
let legacyMigrationDone = false;
async function migrateLegacyAvatar() {
    if (legacyMigrationDone) return;
    try {
        if (!(await fileExists(LEGACY_AVATAR_FILE))) {
            legacyMigrationDone = true;
            return;
        }
        const owner = await prisma.user.findUnique({
            where: { email: LEGACY_OWNER_EMAIL },
            select: { id: true },
        });
        await mkdir(AVATAR_DIR, { recursive: true });
        if (owner?.id) {
            const target = avatarFileFor(owner.id);
            if (!(await fileExists(target))) {
                const raw = await readFile(LEGACY_AVATAR_FILE, 'utf-8');
                await writeFile(target, raw, 'utf-8');
            }
        }
        // Simpan cadangan, lalu nonaktifkan file bersama agar tidak dipakai lagi
        await rename(LEGACY_AVATAR_FILE, LEGACY_BACKUP_FILE);
        legacyMigrationDone = true;
    } catch (err) {
        console.error('Legacy superadmin avatar migration failed:', err);
    }
}

async function resolveTargetUser(req: NextRequest) {
    const requested = req.nextUrl.searchParams.get('userId');
    if (requested) {
        const id = sanitizeUserId(requested);
        if (!id) return null;
        return prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
    }
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
    if (sessionUser?.id) {
        return prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { id: true, email: true, name: true },
        });
    }
    if (sessionUser?.email) {
        return prisma.user.findUnique({
            where: { email: sessionUser.email },
            select: { id: true, email: true, name: true },
        });
    }
    return null;
}

function escapeXml(text: string): string {
    return text.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

function initialSvg(name?: string | null): NextResponse {
    const initial = escapeXml((name?.trim().charAt(0) || 'U').toUpperCase());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9333ea"/><stop offset="1" stop-color="#4338ca"/></linearGradient></defs>
<rect width="128" height="128" fill="url(#g)"/>
<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="56" font-weight="600" fill="#ffffff">${initial}</text>
</svg>`;
    return new NextResponse(svg, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', ...NO_CACHE_HEADERS },
    });
}

async function serveDefault(user: { email?: string | null; name?: string | null } | null) {
    if (user?.email?.toLowerCase().trim() === NISA_EMAIL) {
        const defaultBuffer = await readFile(NISA_DEFAULT_AVATAR_FILE);
        return new NextResponse(defaultBuffer, {
            status: 200,
            headers: { 'Content-Type': 'image/png', ...NO_CACHE_HEADERS },
        });
    }
    return initialSvg(user?.name);
}

export async function GET(req: NextRequest) {
    try {
        await migrateLegacyAvatar();

        const isMeta = req.nextUrl.searchParams.get('meta') === '1';
        const user = await resolveTargetUser(req);
        const customFile = user?.id ? avatarFileFor(user.id) : null;
        const hasCustom = customFile ? await fileExists(customFile) : false;

        if (isMeta) {
            if (hasCustom && customFile) {
                const parsed = JSON.parse(await readFile(customFile, 'utf-8')) as StoredAvatarData;
                return NextResponse.json({ hasCustomAvatar: true, updatedAt: parsed.updatedAt || null });
            }
            return NextResponse.json({ hasCustomAvatar: false, updatedAt: null });
        }

        if (hasCustom && customFile) {
            try {
                const parsed = JSON.parse(await readFile(customFile, 'utf-8')) as StoredAvatarData;
                if (parsed.base64 && parsed.mimeType) {
                    return new NextResponse(Buffer.from(parsed.base64, 'base64'), {
                        status: 200,
                        headers: { 'Content-Type': parsed.mimeType, ...NO_CACHE_HEADERS },
                    });
                }
            } catch (err) {
                console.error('Failed to read user avatar, falling back to default:', err);
            }
        }

        return await serveDefault(user);
    } catch (error) {
        console.error('Error serving avatar:', error);
        return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }
}

function getSessionUserId(session: unknown): string | null {
    const id = (session as { user?: { id?: string } } | undefined)?.user?.id;
    return id ? sanitizeUserId(id) : null;
}

export async function POST(req: NextRequest) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    const userId = getSessionUserId(auth.session);
    if (!userId) {
        return NextResponse.json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 });
    }

    try {
        await migrateLegacyAvatar();

        const contentType = req.headers.get('content-type') || '';
        let mimeType = 'image/png';
        let base64 = '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;
            if (!file) {
                return NextResponse.json({ error: 'Pilih file foto terlebih dahulu.' }, { status: 400 });
            }
            if (!file.type.startsWith('image/')) {
                return NextResponse.json({ error: 'Format file harus berupa gambar (JPG, PNG, WEBP).' }, { status: 400 });
            }
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: 'Ukuran foto maksimal 5 MB.' }, { status: 400 });
            }
            base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
            mimeType = file.type;
        } else {
            const body = await req.json();
            const dataUrl = body?.dataUrl as string | undefined;
            if (!dataUrl || !dataUrl.startsWith('data:image/')) {
                return NextResponse.json({ error: 'Data gambar tidak valid.' }, { status: 400 });
            }
            const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (!matches) {
                return NextResponse.json({ error: 'Format data gambar tidak valid.' }, { status: 400 });
            }
            mimeType = matches[1];
            base64 = matches[2];
        }

        await mkdir(AVATAR_DIR, { recursive: true });

        const payload: StoredAvatarData = {
            mimeType,
            base64,
            updatedAt: new Date().toISOString(),
        };

        // Hanya menimpa foto milik akun yang sedang login
        await writeFile(avatarFileFor(userId), JSON.stringify(payload), 'utf-8');

        return NextResponse.json({
            success: true,
            message: 'Foto profil berhasil diperbarui!',
            updatedAt: payload.updatedAt,
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json({ error: 'Gagal menyimpan foto profil.' }, { status: 500 });
    }
}

export async function DELETE() {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    const userId = getSessionUserId(auth.session);
    if (!userId) {
        return NextResponse.json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 });
    }

    try {
        await migrateLegacyAvatar();
        const file = avatarFileFor(userId);
        if (await fileExists(file)) {
            await unlink(file);
        }
        return NextResponse.json({
            success: true,
            message: 'Foto profil dikembalikan ke foto awal.',
        });
    } catch (error) {
        console.error('Error resetting avatar:', error);
        return NextResponse.json({ error: 'Gagal mengembalikan foto profil.' }, { status: 500 });
    }
}
