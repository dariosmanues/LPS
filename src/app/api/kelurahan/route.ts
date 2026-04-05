import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const kelurahan = await prisma.kelurahan.findMany({
            include: {
                kecamatan: {
                    select: { nama: true },
                },
            },
            orderBy: { nama: 'asc' },
        });
        return NextResponse.json(kelurahan);
    } catch (error) {
        console.error('Error fetching kelurahan:', error);
        return NextResponse.json({ error: 'Failed to fetch kelurahan' }, { status: 500 });
    }
}
