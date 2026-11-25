import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'File tidak ditemukan' },
                { status: 400 }
            );
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.' },
                { status: 400 }
            );
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Ukuran file maksimal 5MB.' },
                { status: 400 }
            );
        }

        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${originalName}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tps3r');
            await mkdir(uploadDir, { recursive: true });
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            return NextResponse.json({
                success: true,
                url: `/uploads/tps3r/${filename}`,
                filename,
            });
        } catch {
            // Fallback to base64 data URL if deployed on a read-only filesystem
            const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
            return NextResponse.json({
                success: true,
                url: dataUrl,
                filename,
            });
        }
    } catch (error) {
        console.error('TPS3R upload error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupload foto' },
            { status: 500 }
        );
    }
}
