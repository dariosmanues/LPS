import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Debug endpoint to check waste logs and users
export async function GET() {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all users with their transdepo
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                transdepo: true,
                role: true,
            },
        });

        // Get today's waste logs with user info
        const todayLogs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                user: {
                    select: { id: true, email: true, name: true, transdepo: true },
                },
            },
        });

        return NextResponse.json({
            users,
            todayLogs: todayLogs.map(log => ({
                id: log.id,
                beratKg: Number(log.beratKg),
                status: log.status,
                recordedAt: log.recordedAt,
                user: {
                    id: log.user.id,
                    email: log.user.email,
                    name: log.user.name,
                    transdepo: log.user.transdepo,
                },
            })),
            summary: {
                totalLogs: todayLogs.length,
                logsWithHarapanJaya: todayLogs.filter(l => l.user.transdepo === 'HARAPAN_JAYA').length,
                logsWithAirHitam: todayLogs.filter(l => l.user.transdepo === 'AIR_HITAM').length,
                logsWithNoTransdepo: todayLogs.filter(l => !l.user.transdepo).length,
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
