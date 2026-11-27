import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncArmadaToTimbangQr } from '@/lib/timbangqr-sync-service';
import { requireSuperAdmin } from '@/lib/permissions';
import { clearArmadaCache } from '../route';
import { extractHeadersInfo, logUserActivity } from '@/lib/user-activity-logger';

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

function parseSafePermit(val: any): string | null | undefined {
    if (val === undefined) return undefined;
    const str = parseSafeString(val);
    if (!str) return null;
    if (str.replace(/[^A-Za-z0-9]/g, '').length < 4) return null;
    if (/^(?:belum|tidak|none|null|kosong|-+)$/i.test(str)) return null;
    return str;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id: rawId } = await params;
        const id = decodeURIComponent(rawId || '').trim();
        const body = await request.json();
        const {
            namaLps, kelurahanId, platNomor, noIzinOperasi,
            namaSupir, namaKetuaLps, noTlpKetuaLps,
            alamatLps, wilayahKerja, nomorSkLps, tanggalSkLps, tanggalTerbitIzin,
            lokasiTransdepo, jenisArmada, isActive, defaultTareKg
        } = body;

        let safeKelurahanId: string | null | undefined = undefined;
        if (kelurahanId !== undefined) {
            const rawKelId = parseSafeString(kelurahanId);
            if (!rawKelId) {
                safeKelurahanId = null;
            } else {
                const kelExists = await prisma.kelurahan.findUnique({
                    where: { id: rawKelId },
                    select: { id: true },
                });
                safeKelurahanId = kelExists ? rawKelId : null;
            }
        }

        const updateData: any = {};
        if (namaLps !== undefined) updateData.namaLps = parseSafeString(namaLps);
        if (platNomor !== undefined) updateData.platNomor = parseSafeString(platNomor);
        if (kelurahanId !== undefined) updateData.kelurahanId = safeKelurahanId;
        if (noIzinOperasi !== undefined) updateData.noIzinOperasi = parseSafePermit(noIzinOperasi);
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
        if (defaultTareKg !== undefined) {
            updateData.defaultTareKg = (defaultTareKg !== null && defaultTareKg !== '') ? parseInt(String(defaultTareKg), 10) : null;
        }
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);
        if (body.isQrUsed !== undefined) updateData.isQrUsed = Boolean(body.isQrUsed);
        if (body.regenerateQr || body.action === 'regenerate') {
            const cleanPlat = (platNomor || id).replace(/[^A-Z0-9]/gi, '').toUpperCase();
            updateData.qrCode = `LPS-${cleanPlat}-${Date.now()}`;
            updateData.isQrUsed = false;
            updateData.qrUsedAt = null;
        }

        // 1. Cari armada berdasarkan ID terlebih dahulu
        let targetArmada = await prisma.armada.findUnique({
            where: { id },
        });

        // 2. Jika tidak ditemukan dengan ID, cari fallback berdasarkan plat nomor atau QR code
        if (!targetArmada) {
            const cleanPlat = parseSafeString(platNomor) || (id.length <= 15 ? id : undefined);
            targetArmada = await prisma.armada.findFirst({
                where: {
                    OR: [
                        { platNomor: id },
                        { qrCode: id },
                        ...(cleanPlat ? [
                            { platNomor: cleanPlat },
                            { platNomor: cleanPlat.replace(/\s+/g, '') }
                        ] : [])
                    ]
                }
            });
        }

        let armada;
        if (targetArmada) {
            // Update armada yang ditemukan
            armada = await prisma.armada.update({
                where: { id: targetArmada.id },
                data: updateData,
                include: {
                    kelurahan: {
                        include: { kecamatan: true }
                    }
                }
            });
        } else {
            // 3. Jika armada sama sekali belum ada di database, buat baru (upsert fallback) jika data pokok tersedia
            const cleanNamaLps = parseSafeString(namaLps);
            const cleanPlatNomor = parseSafeString(platNomor) || (id.length <= 15 ? id : null);

            if (cleanNamaLps && cleanPlatNomor) {
                const qrCode = `LPS-${cleanPlatNomor.replace(/\s/g, '')}-${Date.now()}`;
                armada = await prisma.armada.create({
                    data: {
                        ...updateData,
                        namaLps: cleanNamaLps,
                        platNomor: cleanPlatNomor,
                        qrCode,
                    },
                    include: {
                        kelurahan: {
                            include: { kecamatan: true }
                        }
                    }
                });
            } else {
                return NextResponse.json({
                    error: `Data armada dengan ID atau Nomor Plat "${id}" tidak ditemukan di database. Halaman akan diperbarui otomatis.`,
                    notFound: true
                }, { status: 404 });
            }
        }

        // Otomatis sinkronkan ke TimbangQR jembatan timbang Harapan Jaya
        let timbangQrSync = null;
        try {
            timbangQrSync = await syncArmadaToTimbangQr(armada);
        } catch (syncErr) {
            console.warn('[PATCH /api/armada/[id]] TimbangQR sync warning:', syncErr);
        }

        clearArmadaCache();

        const actorEmail = (auth.session?.user?.email || '').toLowerCase().trim();
        if (actorEmail === 'superadmin@lps.pekanbaru.go.id' || actorEmail === 'superadmin@lps.local') {
            const { clientIp, userAgent } = extractHeadersInfo(request.headers);
            const changes: string[] = [];
            if (targetArmada) {
                const compareFields: Array<[keyof typeof targetArmada, string]> = [
                    ['platNomor', 'Nomor Plat'],
                    ['namaLps', 'Nama LPS'],
                    ['namaSupir', 'Nama Supir'],
                    ['jenisArmada', 'Jenis Armada'],
                    ['defaultTareKg', 'Tarra Default (kg)'],
                    ['lokasiTransdepo', 'Transdepo'],
                    ['namaKetuaLps', 'Ketua LPS'],
                    ['noTlpKetuaLps', 'No Tlp Ketua'],
                    ['noIzinOperasi', 'No Izin'],
                    ['wilayahKerja', 'Wilayah Kerja'],
                    ['isActive', 'Status Aktif'],
                ];
                for (const [k, label] of compareFields) {
                    const oldVal = targetArmada[k];
                    const newVal = (armada as any)[k];
                    if (String(oldVal ?? '-') !== String(newVal ?? '-')) {
                        changes.push(`${label}: "${String(oldVal ?? '-')}" → "${String(newVal ?? '-')}"`);
                    }
                }
            }
            const changeSummary = changes.length > 0 ? `Perubahan: ${changes.join(' | ')}` : 'Perubahan: Klik Simpan tanpa perubahan nilai field';
            logUserActivity({
                userId: auth.session?.user?.id || null,
                userEmail: actorEmail,
                userName: auth.session?.user?.name || null,
                userRole: auth.session?.user?.role || 'SUPERADMIN',
                action: 'DATA_ACTION',
                category: 'DATA_ACTION',
                description: `[CRUD: UPDATE ARMADA] Mengedit Master Armada Plat ${armada.platNomor} (LPS: ${armada.namaLps} • Supir: ${armada.namaSupir || '-'}) — ${changeSummary} (/dashboard/armada)`,
                targetPath: `/api/armada/${armada.id}`,
                ipAddress: clientIp,
                userAgent,
                metadata: { crud: 'UPDATE', entity: 'ARMADA', armadaId: armada.id, platNomor: armada.platNomor, changes },
            });
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
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;

        // Ambil data armada sebelum dihapus untuk menyimpan snapshot & sinkronisasi penonaktifan ke TimbangQR
        const existingArmada = await prisma.armada.findUnique({
            where: { id },
            include: {
                kelurahan: {
                    include: { kecamatan: true },
                },
            },
        });

        if (!existingArmada) {
            return NextResponse.json({ error: 'Data armada tidak ditemukan.' }, { status: 404 });
        }

        // Pastikan kolom armada_id di waste_logs mengizinkan NULL & ON DELETE SET NULL agar transaksi tidak pernah ikut terhapus
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "waste_logs" ALTER COLUMN "armada_id" DROP NOT NULL;`);
            await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'waste_logs_armada_id_fkey'
                        AND table_name = 'waste_logs'
                    ) THEN
                        ALTER TABLE "waste_logs" DROP CONSTRAINT "waste_logs_armada_id_fkey";
                        ALTER TABLE "waste_logs" ADD CONSTRAINT "waste_logs_armada_id_fkey"
                            FOREIGN KEY ("armada_id") REFERENCES "armada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                    END IF;
                END
                $$;
            `);
        } catch (ddlErr) {
            console.warn('[DELETE /api/armada/[id]] DDL check warning:', ddlErr);
        }

        // Ambil semua transaksi (wasteLog) milik armada ini agar datanya tetap terjaga 100% (TIDAK DIHAPUS)
        const wasteLogs = await prisma.wasteLog.findMany({
            where: { armadaId: id },
            select: {
                id: true,
                kelurahanId: true,
                metadata: true,
            },
        });

        // Cek apakah ada armada lain dengan plat nomor yang sama (misal saat menghapus data duplikat)
        const cleanPlate = (existingArmada.platNomor || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const otherArmadas = await prisma.armada.findMany({
            where: { id: { not: id } },
            select: { id: true, platNomor: true, kelurahanId: true, namaLps: true },
        });
        const samePlateArmadas = otherArmadas.filter(
            (a) => (a.platNomor || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanPlate
        );
        const survivingArmada =
            samePlateArmadas.find((a) => a.kelurahanId === existingArmada.kelurahanId) ||
            samePlateArmadas.find((a) => (a.namaLps || '').toLowerCase() === (existingArmada.namaLps || '').toLowerCase()) ||
            samePlateArmadas[0] ||
            null;

        const deletedArmadaSnapshot = {
            id: existingArmada.id,
            platNomor: existingArmada.platNomor,
            namaLps: existingArmada.namaLps,
            namaSupir: existingArmada.namaSupir || null,
            jenisArmada: existingArmada.jenisArmada || null,
            lokasiTransdepo: existingArmada.lokasiTransdepo || null,
            wilayahKerja: existingArmada.wilayahKerja || null,
            noIzinOperasi: existingArmada.noIzinOperasi || null,
            namaKetuaLps: existingArmada.namaKetuaLps || null,
            kelurahanId: existingArmada.kelurahanId || null,
            kelurahanNama: existingArmada.kelurahan?.nama || null,
            kecamatanNama: existingArmada.kelurahan?.kecamatan?.nama || null,
            qrGeneratedIp: existingArmada.qrGeneratedIp || null,
            qrGeneratedUserAgent: existingArmada.qrGeneratedUserAgent || null,
            qrGeneratedBy: existingArmada.qrGeneratedBy || null,
            deletedAt: new Date().toISOString(),
        };

        await prisma.$transaction(async (tx) => {
            if (wasteLogs.length > 0) {
                for (const log of wasteLogs) {
                    let parsedMeta: Record<string, any> = {};
                    if (log.metadata) {
                        try {
                            parsedMeta = JSON.parse(log.metadata);
                        } catch {
                            parsedMeta = {};
                        }
                    }

                    const updatedMetadata = JSON.stringify({
                        ...parsedMeta,
                        platNomor: parsedMeta.platNomor || existingArmada.platNomor,
                        lpsName: parsedMeta.lpsName || existingArmada.namaLps,
                        driverName: parsedMeta.driverName || existingArmada.namaSupir || null,
                        vehicleType: parsedMeta.vehicleType || existingArmada.jenisArmada || null,
                        lokasiTransdepo: parsedMeta.lokasiTransdepo || existingArmada.lokasiTransdepo || null,
                        deletedArmada: deletedArmadaSnapshot,
                    });

                    await tx.wasteLog.update({
                        where: { id: log.id },
                        data: {
                            armadaId: survivingArmada ? survivingArmada.id : null,
                            kelurahanId: log.kelurahanId || existingArmada.kelurahanId || null,
                            metadata: updatedMetadata,
                        },
                    });
                }
            }

            // Hanya hapus master armada, JANGAN hapus wasteLog ataupun timbangQrSync
            await tx.armada.delete({
                where: { id },
            });
        });

        // Sinkronisasi penonaktifan ke TimbangQR sesuai wilayah transdepo (jika tidak ada duplikat aktif dengan plat yang sama)
        if (!survivingArmada) {
            try {
                await syncArmadaToTimbangQr({ ...existingArmada, isActive: false });
            } catch (syncErr) {
                console.warn('[DELETE /api/armada/[id]] TimbangQR deactivation sync warning:', syncErr);
            }
        }

        clearArmadaCache();

        const delActorEmail = (auth.session?.user?.email || '').toLowerCase().trim();
        if (delActorEmail === 'superadmin@lps.pekanbaru.go.id' || delActorEmail === 'superadmin@lps.local') {
            const { clientIp, userAgent } = extractHeadersInfo(request.headers);
            logUserActivity({
                userId: auth.session?.user?.id || null,
                userEmail: delActorEmail,
                userName: auth.session?.user?.name || null,
                userRole: auth.session?.user?.role || 'SUPERADMIN',
                action: 'DATA_ACTION',
                category: 'DATA_ACTION',
                description: `[CRUD: DELETE ARMADA] Menghapus & Menonaktifkan Master Armada Plat ${existingArmada.platNomor} (LPS: ${existingArmada.namaLps} • Supir: ${existingArmada.namaSupir || '-'} • Kelurahan: ${existingArmada.kelurahan?.nama || '-'}) di Master Armada (/dashboard/armada)`,
                targetPath: `/api/armada/${id}`,
                ipAddress: clientIp,
                userAgent,
                metadata: { crud: 'DELETE', entity: 'ARMADA', deletedArmadaSnapshot },
            });
        }

        return NextResponse.json({
            success: true,
            preservedLogsCount: wasteLogs.length,
            reassignedToArmadaId: survivingArmada?.id || null,
        });
    } catch (error: any) {
        console.error('Error deleting armada:', error);

        return NextResponse.json({
            error: `Gagal menghapus data armada: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
    }
}
