import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

        // Fetch logs for the current year, filtered by kelurahanId through armada relation or direct kelurahanId
        const logs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: startOfYear,
                    lte: endOfYear
                },
                OR: [
                    { kelurahanId: kelurahanId },
                    { armada: { kelurahanId: kelurahanId } }
                ]
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
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyData[monthIndex].totalKg += Number(log.beratKg || 0);
            }
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
