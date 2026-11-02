import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncArmadaToTimbangQr } from '@/lib/timbangqr-sync-service';

function parseSafeDate(val: any): Date | null | undefined {
    if (val === undefined) return undefined;
    if (val === null || val === '' || val === 'null' || val === 'undefined') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

function parseSafeString(val: any): string | null | undefined {
    if (val === undefined) return undefined;
    if (val === null) return null;
    const str = String(val).trim();
    if (str === '' || str === 'null' || str === 'undefined') return null;
    return str;
}

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

        let safeKelurahanId: string | null | undefined = undefined;
        if (kelurahanId !== undefined) {
            const rawId = parseSafeString(kelurahanId);
            if (!rawId) {
                safeKelurahanId = null;
            } else {
                const kelExists = await prisma.kelurahan.findUnique({
                    where: { id: rawId },
                    select: { id: true },
                });
                safeKelurahanId = kelExists ? rawId : null;
            }
        }

        const updateData: any = {};
        if (namaLps !== undefined) updateData.namaLps = parseSafeString(namaLps);
        if (platNomor !== undefined) updateData.platNomor = parseSafeString(platNomor);
        if (kelurahanId !== undefined) updateData.kelurahanId = safeKelurahanId;
        if (noIzinOperasi !== undefined) updateData.noIzinOperasi = parseSafeString(noIzinOperasi);
        if (namaSupir !== undefined) updateData.namaSupir = parseSafeString(namaSupir);
        if (namaKetuaLps !== undefined) updateData.namaKetuaLps = parseSafeString(namaKetuaLps);
        if (noTlpKetuaLps !== undefined) updateData.noTlpKetuaLps = parseSafeString(noTlpKetuaLps);
        if (alamatLps !== undefined) updateData.alamatLps = parseSafeString(alamatLps);
        if (wilayahKerja !== undefined) updateData.wilayahKerja = parseSafeString(wilayahKerja);
        if (nomorSkLps !== undefined) updateData.nomorSkLps = parseSafeString(nomorSkLps);
        if (tanggalSkLps !== undefined) updateData.tanggalSkLps = parseSafeDate(tanggalSkLps);
        if (tanggalTerbitIzin !== undefined) updateData.tanggalTerbitIzin = parseSafeDate(tanggalTerbitIzin);
        if (lokasiTransdepo !== undefined) updateData.lokasiTransdepo = parseSafeString(lokasiTransdepo);
        if (jenisArmada !== undefined) updateData.jenisArmada = parseSafeString(jenisArmada);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        const armada = await prisma.armada.update({
            where: { id },
            data: updateData,
            include: {
                kelurahan: {
                    include: { kecamatan: true }
                }
            }
        });

        // Otomatis sinkronkan ke TimbangQR jembatan timbang Harapan Jaya
        let timbangQrSync = null;
        try {
            timbangQrSync = await syncArmadaToTimbangQr(armada);
        } catch (syncErr) {
            console.warn('[PATCH /api/armada/[id]] TimbangQR sync warning:', syncErr);
        }

        return NextResponse.json({
            ...armada,
            timbangQrSync
        });
    } catch (error: any) {
        console.error('Error updating armada:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : (error?.message || 'Failed to update armada'),
            code: error?.code,
        }, { status: 500 });
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
            // Force delete: Hapus timbangqr_syncs terkait, lalu log sampah, baru armadanya
            const wasteLogs = await prisma.wasteLog.findMany({
                where: { armadaId: id },
                select: { id: true },
            });
            const wasteLogIds = wasteLogs.map((w) => w.id);

            const operations = [];
            if (wasteLogIds.length > 0) {
                operations.push(
                    prisma.timbangQrSync.deleteMany({
                        where: { wasteLogId: { in: wasteLogIds } },
                    })
                );
                operations.push(
                    prisma.wasteLog.deleteMany({
                        where: { armadaId: id },
                    })
                );
            }
            operations.push(
                prisma.armada.delete({
                    where: { id },
                })
            );

            await prisma.$transaction(operations);
        } else {
            // Normal delete: Cek apakah armada memiliki log sampah
            const count = await prisma.wasteLog.count({
                where: { armadaId: id },
            });
            if (count > 0) {
                return NextResponse.json({
                    error: `Armada memiliki ${count} riwayat data sampah (Log).`,
                    requiresConfirmation: true,
                }, { status: 409 });
            }

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
