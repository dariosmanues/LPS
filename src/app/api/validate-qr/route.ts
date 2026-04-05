import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    if (!code || !type) {
        return NextResponse.json({ valid: false, message: 'Missing parameters' });
    }

    try {
        if (type === 'armada') {
            const armada = await prisma.armada.findUnique({
                where: { qrCode: code },
                select: { platNomor: true, namaLps: true, namaSupir: true, isActive: true },
            });

            if (!armada) {
                return NextResponse.json({ valid: false, message: 'QR Armada tidak ditemukan' });
            }
            if (!armada.isActive) {
                return NextResponse.json({ valid: false, message: 'Armada tidak aktif' });
            }

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
                return NextResponse.json({ valid: false, message: 'QR Kelurahan tidak ditemukan' });
            }

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
