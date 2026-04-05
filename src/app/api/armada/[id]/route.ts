import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            namaLps, kelurahanId, platNomor, noIzinOperasi,
            namaSupir, namaKetuaLps, noTlpKetuaLps,
            alamatLps, wilayahKerja, nomorSkLps, tanggalSkLps, tanggalTerbitIzin,
            lokasiTransdepo, jenisArmada, isActive
        } = body;

        const armada = await prisma.armada.update({
            where: { id },
            data: {
                namaLps,
                kelurahanId: kelurahanId === '' ? null : kelurahanId,
                platNomor,
                noIzinOperasi: noIzinOperasi || null,
                namaSupir: namaSupir || null,
                namaKetuaLps: namaKetuaLps || null,
                noTlpKetuaLps: noTlpKetuaLps || null,
                alamatLps: alamatLps || null,
                wilayahKerja: wilayahKerja || null,
                nomorSkLps: nomorSkLps || null,
                tanggalSkLps: tanggalSkLps ? new Date(tanggalSkLps) : null,
                tanggalTerbitIzin: tanggalTerbitIzin ? new Date(tanggalTerbitIzin) : null,
                lokasiTransdepo: lokasiTransdepo || null,
                jenisArmada: jenisArmada || null,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });

        return NextResponse.json(armada);
    } catch (error) {
        console.error('Error updating armada:', error);
        return NextResponse.json({ error: 'Failed to update armada' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        if (force) {
            // Force delete: Hapus log sampah terkait dulu, baru armadanya
            await prisma.$transaction([
                prisma.wasteLog.deleteMany({
                    where: { armadaId: id },
                }),
                prisma.armada.delete({
                    where: { id },
                }),
            ]);
        } else {
            // Normal delete
            await prisma.armada.delete({
                where: { id },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting armada:', error);

        if (error.code === 'P2003') {
            return NextResponse.json({
                error: 'Data tidak dapat dihapus karena masih terhubung dengan data lain (Log Sampah).',
                requiresConfirmation: true
            }, { status: 409 });
        }

        return NextResponse.json({
            error: `Gagal menghapus data armada: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
    }
}
