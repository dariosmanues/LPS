import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'today'; // 'today' or 'month'

        // Hitung rentang waktu dalam zona WIB (UTC+7)
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const nowWib = new Date(now.getTime() + wibOffset);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth();
        const d = nowWib.getUTCDate();

        // Hari Ini WIB: 00:00:00 - 24:00:00 WIB
        const startOfDayWib = new Date(Date.UTC(y, m, d, -7, 0, 0, 0));
        const endOfDayWib = new Date(Date.UTC(y, m, d + 1, -7, 0, 0, 0));

        // Tanggal mulai operasional sinkronisasi TimbangQR: 1 Oktober 2026 (sama persis dengan DATA_START_DATE TimbangQR)
        const systemStartDateWib = new Date(Date.UTC(2026, 9, 1, -7, 0, 0, 0));

        // Bulan Ini WIB: Mulai awal bulan (1 Okt 2026) - Akhir Bulan 24:00:00 WIB
        const startOfMonthWib = new Date(Math.max(Date.UTC(y, m, 1, -7, 0, 0, 0), systemStartDateWib.getTime()));
        const endOfMonthWib = new Date(Date.UTC(y, m + 1, 1, -7, 0, 0, 0));

        const filterRange = period === 'month'
            ? { gte: startOfMonthWib, lt: endOfMonthWib }
            : { gte: new Date(Math.max(startOfDayWib.getTime(), systemStartDateWib.getTime())), lt: endOfDayWib };

        // Query logs for the selected period
        const periodLogs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: filterRange,
            },
            include: {
                user: {
                    select: { id: true, transdepo: true },
                },
                armada: {
                    select: { id: true, namaLps: true, platNomor: true, lokasiTransdepo: true },
                },
                timbangQrSync: {
                    select: { ticketNumber: true, lpsName: true }
                }
            },
            orderBy: { recordedAt: 'desc' }
        });

        // Query total master armada Harapan Jaya & master LPS
        const [harapanJayaArmadaCount, totalLpsCount] = await Promise.all([
            prisma.armada.count({
                where: {
                    isActive: true,
                    OR: [
                        { lokasiTransdepo: { contains: 'HARAPAN', mode: 'insensitive' } },
                        { wilayahKerja: { contains: 'HARAPAN', mode: 'insensitive' } }
                    ]
                }
            }),
            prisma.kelurahan.count({
                where: {
                    armada: {
                        some: {
                            isActive: true,
                            OR: [
                                { lokasiTransdepo: { contains: 'HARAPAN', mode: 'insensitive' } },
                                { wilayahKerja: { contains: 'HARAPAN', mode: 'insensitive' } }
                            ]
                        }
                    }
                }
            })
        ]);

        // Helper to aggregate by LPS
        const aggregateByLps = (logs: typeof periodLogs) => {
            const lpsMap = new Map<string, { totalKg: number; tripCount: number }>();

            logs.forEach(log => {
                const lpsName = log.armada?.namaLps || log.timbangQrSync?.lpsName || 'LPS Lainnya';
                const current = lpsMap.get(lpsName) || { totalKg: 0, tripCount: 0 };
                lpsMap.set(lpsName, {
                    totalKg: current.totalKg + Number(log.beratKg),
                    tripCount: current.tripCount + 1
                });
            });

            return Array.from(lpsMap.entries())
                .map(([name, stats]) => ({
                    name,
                    totalKg: stats.totalKg,
                    tripCount: stats.tripCount
                }))
                .sort((a, b) => b.totalKg - a.totalKg);
        };

        // Separate logs by transdepo
        const harapanJayaLogs = periodLogs.filter(log =>
            log.user?.transdepo === 'HARAPAN_JAYA' ||
            log.armada?.lokasiTransdepo?.toUpperCase().includes('HARAPAN') ||
            log.timbangQrSync !== null
        );
        const airHitamLogs = periodLogs.filter(log =>
            log.user?.transdepo === 'AIR_HITAM' ||
            log.armada?.lokasiTransdepo?.toUpperCase().includes('AIR')
        );

        const harapanJayaKg = harapanJayaLogs.reduce((sum, log) => sum + Number(log.beratKg), 0);
        const harapanJayaTrips = harapanJayaLogs.length;
        const harapanJayaLpsStats = aggregateByLps(harapanJayaLogs);

        const airHitamKg = airHitamLogs.reduce((sum, log) => sum + Number(log.beratKg), 0);
        const airHitamTrips = airHitamLogs.length;
        const airHitamLpsStats = aggregateByLps(airHitamLogs);

        const totalKg = periodLogs.reduce((sum, log) => sum + Number(log.beratKg), 0);
        const tripCount = periodLogs.length;
        const uniqueArmada = new Set(periodLogs.map(log => log.armadaId)).size;

        return NextResponse.json({
            period,
            totalKg,
            tripCount,
            uniqueArmada,
            totalArmadaTerdaftar: harapanJayaArmadaCount || 81,
            totalLpsTerdata: totalLpsCount || 53,
            date: startOfDayWib.toISOString().split('T')[0],
            dateLabel: now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            monthLabel: now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),

            harapanJaya: {
                totalKg: harapanJayaKg,
                tripCount: harapanJayaTrips,
                lpsStats: harapanJayaLpsStats,
            },

            airHitam: {
                totalKg: airHitamKg,
                tripCount: airHitamTrips,
                lpsStats: airHitamLpsStats,
            },
        });
    } catch (error) {
        console.error('Error fetching waste stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch waste stats' },
            { status: 500 }
        );
    }
}
