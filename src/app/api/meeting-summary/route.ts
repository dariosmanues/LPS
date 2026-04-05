
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // We will maintain a single summary record for simplicity, or get the latest
        const summary = await prisma.meetingSummary.findFirst({
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(summary || { content: '' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        // Check if a summary exists
        const existing = await prisma.meetingSummary.findFirst();

        let summary;
        if (existing) {
            summary = await prisma.meetingSummary.update({
                where: { id: existing.id },
                data: { content }
            });
        } else {
            summary = await prisma.meetingSummary.create({
                data: { content }
            });
        }

        return NextResponse.json(summary);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save summary' }, { status: 500 });
    }
}
