import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhook, parseWebhookMessage, sendAutoReply, detectKategori } from '@/lib/wa-client';

/**
 * GET — WhatsApp Webhook Verification
 * Meta sends a GET request to verify the webhook URL
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const result = verifyWebhook(mode, token, challenge);

    if (result) {
        return new NextResponse(result, { status: 200 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST — Receive incoming WhatsApp messages
 * Meta sends a POST request when a message is received
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Parse the incoming message
        const parsed = parseWebhookMessage(body);

        if (!parsed) {
            // Acknowledge receipt even if we can't parse (Meta requires 200)
            return NextResponse.json({ status: 'ok' });
        }

        // Check for duplicate message
        const existing = await prisma.laporanMasyarakat.findUnique({
            where: { waMessageId: parsed.messageId },
        });

        if (existing) {
            return NextResponse.json({ status: 'duplicate' });
        }

        // Auto-detect category
        const kategori = detectKategori(parsed.text);

        // Save to database
        const laporan = await prisma.laporanMasyarakat.create({
            data: {
                waMessageId: parsed.messageId,
                senderPhone: parsed.from,
                senderName: parsed.senderName,
                message: parsed.text,
                mediaUrl: parsed.mediaUrl || null,
                kategori: kategori as 'SAMPAH_MENUMPUK' | 'ARMADA_TIDAK_DATANG' | 'JADWAL_PENGANGKUTAN' | 'IURAN' | 'LAINNYA',
                status: 'BARU',
            },
        });

        // Send auto-reply to the sender
        await sendAutoReply(parsed.from, laporan.id);

        return NextResponse.json({ status: 'ok', id: laporan.id });
    } catch (error) {
        console.error('[WA Webhook] Error processing message:', error);
        // Always return 200 to Meta to avoid retries
        return NextResponse.json({ status: 'error' }, { status: 200 });
    }
}
