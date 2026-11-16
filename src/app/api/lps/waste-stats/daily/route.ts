import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let kelurahanId = session.user.kelurahanId;

        if (!kelurahanId) {
            const dbUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        ...(session.user.id ? [{ id: session.user.id }] : []),
                        ...(session.user.email ? [{ email: session.user.email }] : [])
                    ]
                },
                select: { kelurahanId: true }
            });
            if (dbUser?.kelurahanId) {
                kelurahanId = dbUser.kelurahanId;
            }
        }

        if (!kelurahanId) {
            return NextResponse.json(
                { success: false, error: 'User tidak terhubung dengan kelurahan' },
                { status: 400 }
            );
        }

        const kelurahan = await prisma.kelurahan.findUnique({
            where: { id: kelurahanId },
            include: { kecamatan: true }
        });

        // Tentukan bulan berjalan dalam WIB (UTC+7)
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const nowWib = new Date(now.getTime() + wibOffset);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth(); // 0-indexed

        // Mulai operasional resmi: 1 Oktober 2026 (sama persis dengan DATA_START_DATE TimbangQR)
        const systemStartDateWib = new Date(Date.UTC(2026, 9, 1, -7, 0, 0, 0));
        const startOfMonthWib = new Date(Math.max(Date.UTC(y, m, 1, -7, 0, 0, 0), systemStartDateWib.getTime()));
        const endOfMonthWib = new Date(Date.UTC(y, m + 1, 1, -7, 0, 0, 0));

        const monthLabel = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', month: 'long', year: 'numeric' });

        const logs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: startOfMonthWib,
                    lt: endOfMonthWib
                },
                OR: [
                    { kelurahanId: kelurahanId },
                    { armada: { kelurahanId: kelurahanId } }
                ]
            },
            include: {
                armada: {
                    select: {
                        platNomor: true,
                        namaSupir: true,
                        jenisArmada: true,
                        namaLps: true,
                        lokasiTransdepo: true,
                    }
                },
                timbangQrSync: {
                    select: {
                        ticketNumber: true,
                        plateNumber: true,
                        lpsName: true,
                        transdepo: true,
                        grossKg: true,
                        tareKg: true,
                        rafaksiKg: true,
                        nettoKg: true,
                        weighedAt: true
                    }
                }
            },
            orderBy: {
                recordedAt: 'desc'
            }
        });

        // Agregasi per tanggal (harian)
        const dailyMap = new Map<string, { dateStr: string; label: string; day: number; totalKg: number; tripCount: number }>();

        // Siapkan daftar transaksi
        const transactions = logs.map(log => {
            const dateObj = new Date(log.recordedAt);
            const dateWib = new Date(dateObj.getTime() + wibOffset);
            const dayNum = dateWib.getUTCDate();
            const dateStr = dateWib.toISOString().split('T')[0];
            const dateLabel = dateObj.toLocaleDateString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: 'numeric',
                month: 'short'
            });

            const berat = Number(log.beratKg || log.timbangQrSync?.nettoKg || 0);

            // Akumulasi harian
            const currentDaily = dailyMap.get(dateStr) || {
                dateStr,
                label: dateLabel,
                day: dayNum,
                totalKg: 0,
                tripCount: 0
            };
            currentDaily.totalKg += berat;
            currentDaily.tripCount += 1;
            dailyMap.set(dateStr, currentDaily);

            const gross = log.timbangQrSync?.grossKg !== null && log.timbangQrSync?.grossKg !== undefined
                ? Number(log.timbangQrSync.grossKg)
                : null;
            const tare = log.timbangQrSync?.tareKg !== null && log.timbangQrSync?.tareKg !== undefined
                ? Number(log.timbangQrSync.tareKg)
                : null;
            const rafaksi = log.timbangQrSync?.rafaksiKg !== null && log.timbangQrSync?.rafaksiKg !== undefined
                ? Number(log.timbangQrSync.rafaksiKg)
                : 0;
            const netto1 = (gross !== null && tare !== null) ? Math.max(0, gross - tare) : berat;
            const netto2 = (netto1 - rafaksi) > 0 ? (netto1 - rafaksi) : berat;

            let metaObj: Record<string, any> = {};
            if (log.metadata) {
                try {
                    metaObj = JSON.parse(log.metadata);
                } catch {
                    metaObj = {};
                }
            }
            const deletedSnap = metaObj.deletedArmada || {};

            const transdepoRaw = String(log.timbangQrSync?.transdepo || log.armada?.lokasiTransdepo || deletedSnap.lokasiTransdepo || '');
            const transdepoTitle = transdepoRaw.toUpperCase().includes('HARAPAN')
                ? 'TIMBANGQR HARAPAN JAYA'
                : 'TIMBANGQR AIR HITAM';

            const lpsName = log.timbangQrSync?.lpsName || log.armada?.namaLps || deletedSnap.namaLps || (kelurahan ? `LPS ${kelurahan.nama}` : 'LPS Pekanbaru');

            const weighedDateObj = log.timbangQrSync?.weighedAt ? new Date(log.timbangQrSync.weighedAt) : dateObj;
            const weighedAtFormatted = weighedDateObj.toLocaleDateString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) + ', ' + weighedDateObj.toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(':', '.') + ' WIB';

            return {
                id: log.id,
                ticketNumber: log.timbangQrSync?.ticketNumber || metaObj.ticketNumber || `LOG-${log.id.slice(0, 8)}`,
                plateNumber: log.armada?.platNomor || log.timbangQrSync?.plateNumber || deletedSnap.platNomor || metaObj.platNomor || '-',
                driverName: log.armada?.namaSupir || deletedSnap.namaSupir || metaObj.driverName || '-',
                jenisArmada: log.armada?.jenisArmada || deletedSnap.jenisArmada || metaObj.vehicleType || 'DUMPTRUCK',
                beratKg: berat,
                grossKg: gross,
                tareKg: tare,
                rafaksiKg: rafaksi,
                netto1Kg: netto1,
                netto2Kg: netto2,
                transdepo: transdepoTitle,
                lpsName: lpsName,
                weighedAtFormatted: weighedAtFormatted,
                recordedAt: log.recordedAt.toISOString(),
                timeFormatted: dateObj.toLocaleTimeString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    hour: '2-digit',
                    minute: '2-digit'
                }) + ' WIB',
                dateFormatted: dateObj.toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }),
                dateStr,
                status: log.status || 'SELESAI'
            };
        });

        // Urutkan dailyData berdasarkan tanggal menaik (untuk chart)
        const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

        const totalKg = transactions.reduce((sum, t) => sum + t.beratKg, 0);
        const totalRitasi = transactions.length;
        const averageKg = totalRitasi > 0 ? Math.round(totalKg / totalRitasi) : 0;

        return NextResponse.json({
            success: true,
            kelurahan: kelurahan ? {
                id: kelurahan.id,
                nama: kelurahan.nama,
                kecamatan: kelurahan.kecamatan?.nama || '-'
            } : null,
            monthLabel,
            stats: {
                totalKg,
                totalRitasi,
                averageKg
            },
            dailyData,
            transactions
        });

    } catch (error) {
        console.error('Error fetching LPS daily waste stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch daily waste stats' },
            { status: 500 }
        );
    }
}
