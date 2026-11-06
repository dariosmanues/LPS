import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/permissions';

// POST create new kelurahan
export async function POST(request: Request) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { nama, kecamatanId, kodeKemendagri } = body;

        if (!nama || !kecamatanId) {
            return NextResponse.json(
                { error: 'Nama Kelurahan dan Kecamatan wajib diisi' },
                { status: 400 }
            );
        }

        // Cek kecamatan exists
        const kecamatan = await prisma.kecamatan.findUnique({
            where: { id: kecamatanId },
            include: { kelurahan: true },
        });

        if (!kecamatan) {
            return NextResponse.json(
                { error: 'Kecamatan tidak ditemukan' },
                { status: 404 }
            );
        }

        // Tentukan kode kemendagri jika tidak diisi manual
        let kode = (kodeKemendagri || '').trim();
        if (!kode) {
            const nextIndex = kecamatan.kelurahan.length + 1;
            kode = `${kecamatan.kodeKemendagri}.${String(nextIndex).padStart(3, '0')}`;
        }

        // Cek duplikasi kode kemendagri
        const existingKode = await prisma.kelurahan.findUnique({
            where: { kodeKemendagri: kode },
        });
        if (existingKode) {
            return NextResponse.json(
                { error: `Kode Kemendagri ${kode} sudah digunakan kelurahan lain` },
                { status: 400 }
            );
        }

        // Generate QR Code format standar: KEL-1471...
        const rawCode = kode.replace(/\./g, '');
        const qrCode = `KEL-${rawCode}`;

        const kelurahan = await prisma.kelurahan.create({
            data: {
                nama: nama.trim(),
                kecamatanId,
                kodeKemendagri: kode,
                qrCode,
            },
            include: {
                kecamatan: true,
            },
        });

        return NextResponse.json({ success: true, kelurahan }, { status: 201 });
    } catch (error) {
        console.error('Error creating kelurahan:', error);
        return NextResponse.json(
            { error: 'Gagal menambahkan kelurahan baru' },
            { status: 500 }
        );
    }
}

