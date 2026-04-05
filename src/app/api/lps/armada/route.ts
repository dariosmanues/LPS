import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is LPS role
        const lpsRoles = ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'];
        if (!lpsRoles.includes(session.user.role.toUpperCase())) {
            return NextResponse.json(
                { error: 'Forbidden - LPS role required' },
                { status: 403 }
            );
        }

        // Get user's kelurahan from session
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { kelurahanId: true }
        });

        if (!user?.kelurahanId) {
            return NextResponse.json(
                { error: 'User kelurahan not found' },
                { status: 404 }
            );
        }

        // Fetch armada for this kelurahan
        const armada = await prisma.armada.findMany({
            where: {
                kelurahanId: user.kelurahanId,
                isActive: true
            },
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
            },
            orderBy: {
                platNomor: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: armada
        });
    } catch (error) {
        console.error('Error fetching LPS armada:', error);
        return NextResponse.json(
            { error: 'Failed to fetch armada' },
            { status: 500 }
        );
    }
}
