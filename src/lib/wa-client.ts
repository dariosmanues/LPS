/**
 * WhatsApp Cloud API Client
 * Handles sending messages and webhook verification
 */

const WA_API_URL = 'https://graph.facebook.com/v21.0';

function getConfig() {
    return {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'lps_verify_token_2026',
    };
}

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
    const { phoneNumberId, accessToken } = getConfig();

    if (!phoneNumberId || !accessToken) {
        console.warn('[WA] WhatsApp API not configured. Skipping message send.');
        return false;
    }

    try {
        const response = await fetch(`${WA_API_URL}/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: formatPhone(to),
                type: 'text',
                text: { body: text },
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('[WA] Send message error:', err);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[WA] Failed to send message:', error);
        return false;
    }
}

/**
 * Send auto-reply when a community report is received
 */
export async function sendAutoReply(to: string, reportNumber: string): Promise<boolean> {
    const message =
        `✅ *Laporan Anda Telah Diterima*\n\n` +
        `Nomor Laporan: *#${reportNumber.slice(0, 8).toUpperCase()}*\n` +
        `Status: _Sedang ditinjau oleh admin_\n\n` +
        `Terima kasih telah melaporkan. Tim kami akan segera menindaklanjuti.\n\n` +
        `— _Sistem LPS_`;

    return sendWhatsAppMessage(to, message);
}

/**
 * Send admin reply to a community report
 */
export async function sendAdminReply(to: string, replyText: string): Promise<boolean> {
    const message =
        `📋 *Balasan dari Admin LPS*\n\n` +
        `${replyText}\n\n` +
        `— _Admin LPS_`;

    return sendWhatsAppMessage(to, message);
}

/**
 * Verify webhook challenge from Meta
 */
export function verifyWebhook(mode: string | null, token: string | null, challenge: string | null): string | null {
    const { verifyToken } = getConfig();

    if (mode === 'subscribe' && token === verifyToken) {
        return challenge;
    }
    return null;
}

/**
 * Parse incoming WhatsApp webhook payload
 */
export function parseWebhookMessage(body: Record<string, unknown>): {
    messageId: string;
    from: string;
    senderName: string;
    text: string;
    timestamp: string;
    mediaUrl?: string;
} | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (body as any)?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];

        if (!message) return null;

        const contact = value?.contacts?.[0];

        return {
            messageId: message.id || '',
            from: message.from || '',
            senderName: contact?.profile?.name || 'Unknown',
            text: message.text?.body || message.caption || '[Media]',
            timestamp: message.timestamp || '',
            mediaUrl: message.image?.id || message.document?.id || undefined,
        };
    } catch {
        console.error('[WA] Failed to parse webhook payload');
        return null;
    }
}

/**
 * Auto-detect category from message text
 */
export function detectKategori(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('sampah') && (lower.includes('menumpuk') || lower.includes('numpuk') || lower.includes('banyak') || lower.includes('berserakan'))) {
        return 'SAMPAH_MENUMPUK';
    }
    if (lower.includes('armada') || lower.includes('truk') || lower.includes('mobil sampah') || lower.includes('tidak datang') || lower.includes('tidak lewat')) {
        return 'ARMADA_TIDAK_DATANG';
    }
    if (lower.includes('jadwal') || lower.includes('kapan') || lower.includes('jam berapa')) {
        return 'JADWAL_PENGANGKUTAN';
    }
    if (lower.includes('iuran') || lower.includes('bayar') || lower.includes('tagihan') || lower.includes('biaya')) {
        return 'IURAN';
    }

    return 'LAINNYA';
}

/**
 * Format phone number to international format
 */
function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '62' + cleaned.slice(1);
    if (cleaned.startsWith('62')) return cleaned;
    return cleaned;
}
