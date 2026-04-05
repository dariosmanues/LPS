
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function GET() {
    try {
        const notes = await prisma.meetingNote.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(notes);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'notes');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // ignore if exists
        }

        // Generate unique filename to avoid collision
        const timestamp = Date.now();
        const originalName = file.name.replace(/\s+/g, '_'); // sanitize
        const filename = `${timestamp}-${originalName}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/notes/${filename}`;
        const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';

        const note = await prisma.meetingNote.create({
            data: {
                title: file.name,
                fileUrl,
                fileType
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
