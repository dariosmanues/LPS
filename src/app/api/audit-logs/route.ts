import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        const plat = searchParams.get('plat')?.trim();
        const qrCode = searchParams.get('qrCode')?.trim();
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

        const where: Record<string, unknown> = {};

        if (plat) {
            where.platNomor = { contains: plat, mode: 'insensitive' };
        }
        if (qrCode) {
            where.qrCode = { contains: qrCode, mode: 'insensitive' };
        }

        const [total, logs] = await Promise.all([
            prisma.scanAuditLog.count({ where }),
            prisma.scanAuditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit,
            }),
        ]);

        return NextResponse.json({
            success: true,
            total,
            page,
            limit,
            logs,
        });
    } catch (error) {
        console.error('Error fetching scan audit logs:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data log audit scan QR' },
            { status: 500 }
        );
    }
}

