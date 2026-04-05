import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Save meeting summary to archive
export async function POST(request: Request) {
    try {
        const { content } = await request.json();

        if (!content || content.trim() === '') {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Create archive entry
        const archive = await prisma.meetingSummaryArchive.create({
            data: {
                content: content.trim(),
            },
        });

        // Clear the current meeting summary
        const summaries = await prisma.meetingSummary.findMany();
        if (summaries.length > 0) {
            await prisma.meetingSummary.update({
                where: { id: summaries[0].id },
                data: { content: '' },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Meeting summary archived successfully',
            data: archive,
        });
    } catch (error) {
        console.error('Error archiving meeting summary:', error);
        return NextResponse.json(
            { error: 'Failed to archive meeting summary' },
            { status: 500 }
        );
    }
}

// GET: Fetch all archived summaries
export async function GET() {
    try {
        const archives = await prisma.meetingSummaryArchive.findMany({
            orderBy: { archivedAt: 'desc' },
        });

        return NextResponse.json(archives);
    } catch (error) {
        console.error('Error fetching archives:', error);
        return NextResponse.json(
            { error: 'Failed to fetch archives' },
            { status: 500 }
        );
    }
}
