import { prisma } from './prisma';

export interface ClientAuditInfo {
    clientIp: string;
    userAgent: string;
}

/**
 * Ekstrak Client IP dan User-Agent dari request header secara aman & cepat (0 ms)
 */
export function getClientInfo(request: Request): ClientAuditInfo {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    // Ambil IP pertama jika x-forwarded-for berisi comma-separated IPs (misal: "114.124.x.x, 10.0.0.1")
    let clientIp = 'unknown';
    if (forwarded) {
        clientIp = forwarded.split(',')[0].trim();
    } else if (realIp) {
        clientIp = realIp.trim();
    } else if (cfConnectingIp) {
        clientIp = cfConnectingIp.trim();
    }

    const userAgent = request.headers.get('user-agent')?.slice(0, 255) || 'unknown';

    return { clientIp, userAgent };
}

export interface ScanAuditParams {
    qrCode: string;
    platNomor?: string | null;
    namaLps?: string | null;
    action?: 'SCAN_VALIDATE' | 'WEIGHING_SYNC' | 'MANUAL_ENTRY';
    clientIp?: string;
    userAgent?: string;
    status?: 'SUCCESS' | 'INVALID' | 'BURNED' | 'NOT_FOUND' | 'ERROR';
    metadata?: Record<string, unknown>;
}

/**
 * Mencatat audit scan QR secara non-blocking (fire-and-forget).
 * Tidak menambah latensi/beban request user sama sekali.
 */
export function logScanAudit({
    qrCode,
    platNomor,
    namaLps,
    action = 'SCAN_VALIDATE',
    clientIp = 'unknown',
    userAgent = 'unknown',
    status = 'SUCCESS',
    metadata = {},
}: ScanAuditParams): void {
    // Jalankan di background tanpa await agar tidak memperlambat response HTTP
    prisma.scanAuditLog
        .create({
            data: {
                qrCode,
                platNomor: platNomor || null,
                namaLps: namaLps || null,
                action,
                clientIp,
                userAgent,
                status,
                metadata: JSON.stringify(metadata),
            },
        })
        .catch((err) => {
            console.error('[Audit Logger Error]', err);
        });
}

export interface QrFailureParams {
    transdepo?: string | null;
    platNomor?: string | null;
    namaLps?: string | null;
    kelurahan?: string | null;
    kecamatan?: string | null;
    qrCode?: string | null;
    kategoriAlasan: string; // HANGUS, USANG, KADALUARSA, TIDAK_TERDAFTAR, PLAT_TIDAK_SESUAI, LAINNYA
    keterangan?: string | null;
    tindakan?: string | null;
    operatorName?: string | null;
    tiketNumberRef?: string | null;
    fotoKondisiUrl?: string | null;
}

/**
 * Mencatat kendala / kegagalan scan QR (Hangus, Usang, Tidak Terdaftar, dll).
 * Mengembalikan Promise agar route handler dapat memastikan data tersimpan.
 */
export async function logQrFailure({
    transdepo,
    platNomor,
    namaLps,
    kelurahan,
    kecamatan,
    qrCode,
    kategoriAlasan,
    keterangan,
    tindakan = 'DIARAHKAN_CETAK_ULANG',
    operatorName = 'Sistem Auto-Detect',
    tiketNumberRef,
    fotoKondisiUrl,
}: QrFailureParams): Promise<void> {
    const depo = String(transdepo || '').toUpperCase();
    const cleanDepo = depo.includes('HARAPAN') ? 'HARAPAN_JAYA' : 'AIR_HITAM';

    try {
        await prisma.qrFailureReport.create({
            data: {
                transdepo: cleanDepo,
                platNomor: platNomor || null,
                namaLps: namaLps || null,
                kelurahan: kelurahan || null,
                kecamatan: kecamatan || null,
                qrCode: qrCode || null,
                kategoriAlasan: (kategoriAlasan || 'LAINNYA').toUpperCase(),
                keterangan: keterangan || null,
                tindakan: tindakan || 'TIDAK_DITIMBANG',
                operatorName: operatorName || 'Sistem Auto',
                tiketNumberRef: tiketNumberRef || null,
                fotoKondisiUrl: fotoKondisiUrl || null,
            },
        });
    } catch (err) {
        console.error('[QR Failure Logger Error]', err);
    }
}

