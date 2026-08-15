import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET — List all community reports with filtering
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const kategori = searchParams.get('kategori');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        // Build filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (kategori && kategori !== 'ALL') {
            where.kategori = kategori;
        }
        if (search) {
            where.OR = [
                { senderName: { contains: search, mode: 'insensitive' } },
                { senderPhone: { contains: search } },
                { message: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total, counts] = await Promise.all([
            prisma.laporanMasyarakat.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.laporanMasyarakat.count({ where }),
            // Get counts by status
            Promise.all([
                prisma.laporanMasyarakat.count({ where: { status: 'BARU' } }),
                prisma.laporanMasyarakat.count({ where: { status: 'DIPROSES' } }),
                prisma.laporanMasyarakat.count({ where: { status: 'SELESAI' } }),
                prisma.laporanMasyarakat.count({ where: { status: 'DITOLAK' } }),
                prisma.laporanMasyarakat.count(),
            ]),
        ]);

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                baru: counts[0],
                diproses: counts[1],
                selesai: counts[2],
                ditolak: counts[3],
                total: counts[4],
            },
        });
    } catch (error) {
        console.error('Error fetching laporan masyarakat:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

/**
 * POST — Manually create a report (from admin or for testing)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const laporan = await prisma.laporanMasyarakat.create({
            data: {
                senderPhone: body.senderPhone,
                senderName: body.senderName || null,
                message: body.message,
                kategori: body.kategori || 'LAINNYA',
                status: 'BARU',
            },
        });

        return NextResponse.json({ success: true, data: laporan });
    } catch (error) {
        console.error('Error creating laporan:', error);
        return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }
}
