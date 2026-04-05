import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const kecamatan = await prisma.kecamatan.findMany({
            include: {
                kelurahan: {
                    orderBy: { nama: 'asc' },
                },
            },
            orderBy: { nama: 'asc' },
        });
        return NextResponse.json(kecamatan);
    } catch (error) {
        console.error('Error fetching wilayah:', error);
        return NextResponse.json({ error: 'Failed to fetch wilayah' }, { status: 500 });
    }
}
