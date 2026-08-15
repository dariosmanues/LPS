import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminReply } from '@/lib/wa-client';

/**
 * GET — Get single report detail
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const laporan = await prisma.laporanMasyarakat.findUnique({
            where: { id },
        });

        if (!laporan) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: laporan });
    } catch (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

/**
 * PATCH — Update report status, add notes, or send reply
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { status, kategori, adminNotes, replyMessage } = body;

        // Build update data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};

        if (status) updateData.status = status;
        if (kategori) updateData.kategori = kategori;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        // If replying, send WhatsApp message and record it
        if (replyMessage) {
            const laporan = await prisma.laporanMasyarakat.findUnique({
                where: { id },
            });

            if (laporan) {
                await sendAdminReply(laporan.senderPhone, replyMessage);
                updateData.replyMessage = replyMessage;
                updateData.repliedAt = new Date();
            }
        }

        const updated = await prisma.laporanMasyarakat.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

/**
 * DELETE — Delete a report
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await prisma.laporanMasyarakat.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting report:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
