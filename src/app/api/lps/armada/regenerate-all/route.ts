import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userRole = (session.user.role || '').toUpperCase();
        const lpsRoles = ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'];
        const isAdmin = userRole === 'ADMIN';

        if (!isAdmin && !lpsRoles.includes(userRole)) {
            return NextResponse.json(
                { error: 'Forbidden - LPS role or ADMIN required' },
                { status: 403 }
            );
        }

        let kelurahanId = session.user.kelurahanId;
        if (!isAdmin) {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        ...(session.user.id ? [{ id: session.user.id }] : []),
                        ...(session.user.email ? [{ email: session.user.email }] : [])
                    ]
                },
                select: { kelurahanId: true }
            });

            if (user?.kelurahanId) {
                kelurahanId = user.kelurahanId;
            }
        }

        const armadas = await prisma.armada.findMany({
            where: {
                ...(kelurahanId ? { kelurahanId } : {}),
                isActive: true,
            },
            select: { id: true, platNomor: true }
        });

        const now = Date.now();
        let updatedCount = 0;

        for (let i = 0; i < armadas.length; i++) {
            const a = armadas[i];
            const cleanPlate = a.platNomor.replace(/\s/g, '').toUpperCase();
            const newQrCode = `LPS-${cleanPlate}-${now + i}`;
            await prisma.armada.update({
                where: { id: a.id },
                data: {
                    qrCode: newQrCode,
                    isQrUsed: false,
                    qrUsedAt: null,
                }
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil regenerate ${updatedCount} QR Code armada.`,
            count: updatedCount
        });
    } catch (error) {
        console.error('[QR Regenerate All] Error:', error);
        return NextResponse.json(
            { error: 'Gagal me-regenerate semua QR code', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
