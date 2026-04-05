import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE - Reset/delete all waste logs
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const resetType = searchParams.get('type') || 'today';

        let deleteCondition = {};

        if (resetType === 'today') {
            // Reset only today's data
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            deleteCondition = {
                recordedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            };
        }
        // If resetType === 'all', deleteCondition stays empty (deletes all)

        const result = await prisma.wasteLog.deleteMany({
            where: deleteCondition,
        });

        return NextResponse.json({
            success: true,
            message: `Berhasil menghapus ${result.count} data sampah`,
            deletedCount: result.count,
        });
    } catch (error) {
        console.error('Error resetting waste data:', error);
        return NextResponse.json(
            { error: 'Failed to reset waste data' },
            { status: 500 }
        );
    }
}
