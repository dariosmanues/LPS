import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        console.log('[QR Regenerate] Starting regeneration for armada ID:', params.id);

        // Get authenticated session
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.error('[QR Regenerate] No session found');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[QR Regenerate] User authenticated:', session.user.email, 'Role:', session.user.role);

        // Check if user is LPS role
        const lpsRoles = ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'];
        if (!lpsRoles.includes(session.user.role.toUpperCase())) {
            console.error('[QR Regenerate] User role not authorized:', session.user.role);
            return NextResponse.json(
                { error: 'Forbidden - LPS role required' },
                { status: 403 }
            );
        }

        const armadaId = params.id;
        console.log('[QR Regenerate] Processing armada ID:', armadaId);

        // Get user's kelurahan
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { kelurahanId: true }
        });

        if (!user?.kelurahanId) {
            console.error('[QR Regenerate] User kelurahan not found for user:', session.user.id);
            return NextResponse.json(
                { error: 'User kelurahan not found' },
                { status: 404 }
            );
        }

        console.log('[QR Regenerate] User kelurahan:', user.kelurahanId);

        // Verify armada belongs to user's kelurahan
        const armada = await prisma.armada.findUnique({
            where: { id: armadaId },
            select: { kelurahanId: true, platNomor: true }
        });

        if (!armada) {
            console.error('[QR Regenerate] Armada not found:', armadaId);
            return NextResponse.json(
                { error: 'Armada not found' },
                { status: 404 }
            );
        }

        console.log('[QR Regenerate] Armada found:', armada.platNomor, 'Kelurahan:', armada.kelurahanId);

        if (armada.kelurahanId !== user.kelurahanId) {
            console.error('[QR Regenerate] Armada kelurahan mismatch. User:', user.kelurahanId, 'Armada:', armada.kelurahanId);
            return NextResponse.json(
                { error: 'Forbidden - Armada not in your kelurahan' },
                { status: 403 }
            );
        }

        // Generate new QR code with timestamp to ensure uniqueness
        const newQrCode = `LPS-${armada.platNomor.replace(/\s/g, '')}-${Date.now()}`;
        console.log('[QR Regenerate] Generated new QR code:', newQrCode);

        // Update armada with new QR code
        const updatedArmada = await prisma.armada.update({
            where: { id: armadaId },
            data: { qrCode: newQrCode },
            select: {
                id: true,
                namaLps: true,
                platNomor: true,
                namaSupir: true,
                jenisArmada: true,
                qrCode: true,
                kelurahan: {
                    select: {
                        nama: true,
                        kecamatan: {
                            select: {
                                nama: true
                            }
                        }
                    }
                }
            }
        });

        console.log('[QR Regenerate] Successfully updated armada with new QR code');

        return NextResponse.json({
            success: true,
            message: 'QR Code berhasil di-regenerate',
            data: updatedArmada
        });
    } catch (error) {
        console.error('[QR Regenerate] Error:', error);
        console.error('[QR Regenerate] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            {
                error: 'Failed to regenerate QR code',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
