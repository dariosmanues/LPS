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

        // Check if user is LPS role or ADMIN
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
            // Get user's kelurahan from session or DB
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

            if (!kelurahanId) {
                return NextResponse.json(
                    { error: 'User kelurahan not found' },
                    { status: 404 }
                );
            }
        }

        // Fetch armada for this kelurahan (or all if ADMIN)
        const armada = await prisma.armada.findMany({
            where: {
                ...(kelurahanId ? { kelurahanId } : {}),
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
