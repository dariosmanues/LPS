import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { readFile, writeFile, mkdir, unlink, access } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const CUSTOM_AVATAR_FILE = join(UPLOAD_DIR, 'superadmin-avatar.json');
const DEFAULT_AVATAR_FILE = join(process.cwd(), 'public', 'avatar-superadmin.png');

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

export async function GET(req: NextRequest) {
    try {
        const isMeta = req.nextUrl.searchParams.get('meta') === '1';
        const hasCustom = await fileExists(CUSTOM_AVATAR_FILE);

        if (isMeta) {
            if (hasCustom) {
                const raw = await readFile(CUSTOM_AVATAR_FILE, 'utf-8');
                const parsed = JSON.parse(raw) as StoredAvatarData;
                return NextResponse.json({
                    hasCustomAvatar: true,
                    updatedAt: parsed.updatedAt || null,
                });
            }
            return NextResponse.json({
                hasCustomAvatar: false,
                updatedAt: null,
            });
        }

        if (hasCustom) {
            try {
                const raw = await readFile(CUSTOM_AVATAR_FILE, 'utf-8');
                const parsed = JSON.parse(raw) as StoredAvatarData;
                if (parsed.base64 && parsed.mimeType) {
                    const imgBuffer = Buffer.from(parsed.base64, 'base64');
                    return new NextResponse(imgBuffer, {
                        status: 200,
                        headers: {
                            'Content-Type': parsed.mimeType,
                            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                        },
                    });
                }
            } catch (err) {
                console.error('Failed to read custom superadmin avatar, falling back to default:', err);
            }
        }

        const defaultBuffer = await readFile(DEFAULT_AVATAR_FILE);
        return new NextResponse(defaultBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Error serving superadmin avatar:', error);
        return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
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
            const arrayBuffer = await file.arrayBuffer();
            base64 = Buffer.from(arrayBuffer).toString('base64');
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

        await mkdir(UPLOAD_DIR, { recursive: true });

        const payload: StoredAvatarData = {
            mimeType,
            base64,
            updatedAt: new Date().toISOString(),
        };

        await writeFile(CUSTOM_AVATAR_FILE, JSON.stringify(payload), 'utf-8');

        return NextResponse.json({
            success: true,
            message: 'Foto profil berhasil diperbarui!',
            updatedAt: payload.updatedAt,
        });
    } catch (error) {
        console.error('Error uploading superadmin avatar:', error);
        return NextResponse.json({ error: 'Gagal menyimpan foto profil.' }, { status: 500 });
    }
}

export async function DELETE() {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        if (await fileExists(CUSTOM_AVATAR_FILE)) {
            await unlink(CUSTOM_AVATAR_FILE);
        }
        return NextResponse.json({
            success: true,
            message: 'Foto profil dikembalikan ke foto awal.',
        });
    } catch (error) {
        console.error('Error resetting superadmin avatar:', error);
        return NextResponse.json({ error: 'Gagal mengembalikan foto profil.' }, { status: 500 });
    }
}
