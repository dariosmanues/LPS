import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientInfo, logScanAudit } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    if (!code || !type) {
        return NextResponse.json({ valid: false, message: 'Missing parameters' });
    }

    const { clientIp, userAgent } = getClientInfo(request);

    try {
        if (type === 'armada') {
            const armada = await prisma.armada.findUnique({
                where: { qrCode: code },
                select: { platNomor: true, namaLps: true, namaSupir: true, isActive: true },
            });

            if (!armada) {
                logScanAudit({
                    qrCode: code,
                    action: 'SCAN_VALIDATE',
                    clientIp,
                    userAgent,
                    status: 'NOT_FOUND',
                });
                return NextResponse.json({ valid: false, message: 'QR Armada tidak ditemukan' });
            }
            if (!armada.isActive) {
                logScanAudit({
                    qrCode: code,
                    platNomor: armada.platNomor,
                    namaLps: armada.namaLps,
                    action: 'SCAN_VALIDATE',
                    clientIp,
                    userAgent,
                    status: 'INVALID',
                    metadata: { reason: 'Armada tidak aktif' },
                });
                return NextResponse.json({ valid: false, message: 'Armada tidak aktif' });
            }

            logScanAudit({
                qrCode: code,
                platNomor: armada.platNomor,
                namaLps: armada.namaLps,
                action: 'SCAN_VALIDATE',
                clientIp,
                userAgent,
                status: 'SUCCESS',
            });

            return NextResponse.json({
                valid: true,
                data: {
                    platNomor: armada.platNomor,
                    namaLps: armada.namaLps,
                    namaSupir: armada.namaSupir
                },
            });
        } else if (type === 'kelurahan') {
            const kelurahan = await prisma.kelurahan.findUnique({
                where: { qrCode: code },
                include: { kecamatan: { select: { nama: true } } },
            });

            if (!kelurahan) {
                logScanAudit({
                    qrCode: code,
                    action: 'SCAN_VALIDATE',
                    clientIp,
                    userAgent,
                    status: 'NOT_FOUND',
                    metadata: { type: 'kelurahan' },
                });
                return NextResponse.json({ valid: false, message: 'QR Kelurahan tidak ditemukan' });
            }

            logScanAudit({
                qrCode: code,
                action: 'SCAN_VALIDATE',
                clientIp,
                userAgent,
                status: 'SUCCESS',
                metadata: { type: 'kelurahan', kelurahan: kelurahan.nama },
            });

            return NextResponse.json({
                valid: true,
                data: { nama: kelurahan.nama, kecamatan: kelurahan.kecamatan.nama },
            });
        }

        return NextResponse.json({ valid: false, message: 'Invalid type' });
    } catch (error) {
        console.error('Error validating QR:', error);
        return NextResponse.json({ valid: false, message: 'Server error' });
    }
}
