import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

        // Fetch logs for the current year
        const logs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            select: {
                beratKg: true,
                recordedAt: true
            }
        });

        // Initialize monthly data
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
        ];

        const monthlyData = months.map(month => ({
            month,
            totalKg: 0
        }));

        // Aggregate data
        logs.forEach(log => {
            const date = new Date(log.recordedAt);
            const monthIndex = date.getMonth();
            monthlyData[monthIndex].totalKg += Number(log.beratKg);
        });

        return NextResponse.json({
            success: true,
            data: monthlyData
        });

    } catch (error) {
        console.error('Error fetching monthly stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch monthly stats' },
            { status: 500 }
        );
    }
}
