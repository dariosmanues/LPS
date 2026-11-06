import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientInfo, logScanAudit } from '@/lib/audit-logger';


// Demo user ID - in production, get from session
const DEMO_USER_ID = 'demo-gatekeeper';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    try {
        const systemStartDate = new Date('2026-10-12T00:00:00+07:00');
        const logs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: systemStartDate
                }
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { recordedAt: 'desc' },
            include: {
                armada: {
                    select: {
                        platNomor: true,
                        namaSupir: true,
                        namaLps: true,
                        namaKetuaLps: true,
                        qrGeneratedIp: true,
                        qrGeneratedUserAgent: true,
                        qrGeneratedBy: true,
                    }
                },
                kelurahan: {
                    select: { nama: true, kecamatan: { select: { nama: true } } },
                },
                user: { select: { name: true } },
            },
        });

        const total = await prisma.wasteLog.count({
            where: {
                recordedAt: {
                    gte: systemStartDate
                }
            }
        });

        return NextResponse.json({ logs, total, page, limit });
    } catch (error) {
        console.error('Error fetching waste logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { armadaQrCode, kelurahanQrCode, beratKg, status } = body;

        // Validate required fields
        if (!armadaQrCode || !beratKg || !status) {
            return NextResponse.json(
                { success: false, message: 'Data tidak lengkap' },
                { status: 400 }
            );
        }

        // Validate armada
        const armada = await prisma.armada.findUnique({
            where: { qrCode: armadaQrCode },
        });

        if (!armada) {
            return NextResponse.json(
                { success: false, message: 'QR Armada tidak valid' },
                { status: 400 }
            );
        }

        if (!armada.isActive) {
            return NextResponse.json(
                { success: false, message: 'Armada tidak aktif' },
                { status: 400 }
            );
        }

        // Validate kelurahan (optional)
        let kelurahanId = null;
        if (kelurahanQrCode) {
            const kelurahan = await prisma.kelurahan.findUnique({
                where: { qrCode: kelurahanQrCode },
            });
            if (!kelurahan) {
                return NextResponse.json(
                    { success: false, message: 'QR Kelurahan tidak valid' },
                    { status: 400 }
                );
            }
            kelurahanId = kelurahan.id;
        }

        // Get or create demo user
        let user = await prisma.user.findFirst({
            where: { role: 'GATEKEEPER' },
        });

        if (!user) {
            // Create a demo gatekeeper if none exists
            user = await prisma.user.create({
                data: {
                    email: 'gatekeeper@demo.lps',
                    passwordHash: 'demo',
                    name: 'Demo Gatekeeper',
                    role: 'GATEKEEPER',
                },
            });
        }

        const { clientIp, userAgent } = getClientInfo(request);
        const displayIp = armada.qrGeneratedIp || clientIp;
        const displayUserAgent = armada.qrGeneratedUserAgent || userAgent;
        const qrCreatorName = armada.qrGeneratedBy || armada.namaKetuaLps || null;

        // Create waste log
        const wasteLog = await prisma.wasteLog.create({
            data: {
                armadaId: armada.id,
                kelurahanId,
                recordedBy: user.id,
                beratKg: parseFloat(beratKg),
                status: status,
                metadata: JSON.stringify({
                    scannedAt: new Date().toISOString(),
                    deviceInfo: 'mobile-web',
                    clientIp: displayIp,
                    userAgent: displayUserAgent,
                    qrCreatorName,
                    qrCreatorIp: armada.qrGeneratedIp || null,
                    operatorIp: clientIp,
                }),
            },
            include: {
                armada: {
                    select: {
                        platNomor: true,
                        namaSupir: true,
                        namaLps: true,
                        namaKetuaLps: true,
                        qrGeneratedIp: true,
                        qrGeneratedUserAgent: true,
                        qrGeneratedBy: true,
                    }
                },
                kelurahan: {
                    select: { nama: true, kecamatan: { select: { nama: true } } },
                },
            },
        });

        logScanAudit({
            qrCode: armadaQrCode,
            platNomor: armada.platNomor,
            namaLps: armada.namaLps,
            action: 'MANUAL_ENTRY',
            clientIp: displayIp,
            userAgent: displayUserAgent,
            status: 'SUCCESS',
            metadata: {
                beratKg: parseFloat(beratKg),
                status,
                wasteLogId: wasteLog.id,
                qrCreatorName,
                qrCreatorIp: armada.qrGeneratedIp || null,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Data berhasil disimpan - ${status}`,
            data: {
                logId: wasteLog.id,
                armada: {
                    platNomor: wasteLog.armada.platNomor,
                    driver: wasteLog.armada.namaSupir,
                },
                kelurahan: wasteLog.kelurahan
                    ? {
                        nama: wasteLog.kelurahan.nama,
                        kecamatan: wasteLog.kelurahan.kecamatan.nama,
                    }
                    : null,
                beratKg: parseFloat(beratKg),
                status,
                timestamp: wasteLog.recordedAt,
            },
        });
    } catch (error) {
        console.error('Error creating waste log:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan sistem' },
            { status: 500 }
        );
    }
}
