import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's waste logs with user transdepo info
        const todayLogs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                user: {
                    select: { id: true, transdepo: true },
                },
                armada: {
                    select: { namaLps: true },
                },
            },
        });

        // Separate logs by transdepo (based on user's transdepo assignment)
        const harapanJayaLogs = todayLogs.filter(log => log.user.transdepo === 'HARAPAN_JAYA');
        const airHitamLogs = todayLogs.filter(log => log.user.transdepo === 'AIR_HITAM');

        // Helper to aggregate by LPS
        const aggregateByLps = (logs: typeof todayLogs) => {
            const lpsMap = new Map<string, { totalKg: number; tripCount: number }>();

            logs.forEach(log => {
                const lpsName = log.armada.namaLps;
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

        // Calculate totals for Harapan Jaya
        const harapanJayaKg = harapanJayaLogs.reduce((sum, log) => sum + Number(log.beratKg), 0);
        const harapanJayaTrips = harapanJayaLogs.length;
        const harapanJayaLpsStats = aggregateByLps(harapanJayaLogs);

        // Calculate totals for Air Hitam
        const airHitamKg = airHitamLogs.reduce((sum, log) => sum + Number(log.beratKg), 0);
        const airHitamTrips = airHitamLogs.length;
        const airHitamLpsStats = aggregateByLps(airHitamLogs);

        // Overall totals
        const totalKg = todayLogs.reduce((sum, log) => sum + Number(log.beratKg), 0);
        const tripCount = todayLogs.length;
        const uniqueArmada = new Set(todayLogs.map(log => log.armadaId)).size;

        return NextResponse.json({
            // Overall stats
            totalKg,
            tripCount,
            uniqueArmada,
            date: today.toISOString().split('T')[0],

            // Transdepo Harapan Jaya stats
            harapanJaya: {
                totalKg: harapanJayaKg,
                tripCount: harapanJayaTrips,
                lpsStats: harapanJayaLpsStats,
            },

            // Transdepo Air Hitam stats
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




