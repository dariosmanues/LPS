import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { normalizePlate } from '@/lib/timbangqr-qr-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user?.role || '').toUpperCase();
        const isOperatorOrAdmin = ['ADMIN', 'OPERATOR'].includes(userRole);

        // Validasi secret jika dipanggil secara programmatic / server-to-server
        const secret = process.env.TIMBANGQR_INTEGRATION_SECRET || process.env.LPS_INTEGRATION_SECRET;
        const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
        const hasValidSecret = Boolean(secret && authHeader && authHeader === secret);

        // Jika user bukan admin/operator dan tidak punya valid secret
        if (session?.user && !isOperatorOrAdmin && !hasValidSecret) {
            return NextResponse.json({
                error: 'Hanya Operator atau Administrator yang berwenang memverifikasi armada multi-LPS.'
            }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const { armadaId, platNomor, isVerified = true } = body;

        if (!armadaId && !platNomor) {
            return NextResponse.json({
                error: 'Parameter armadaId atau platNomor harus disertakan.'
            }, { status: 400 });
        }

        let targetPlate = platNomor;
        if (!targetPlate && armadaId) {
            const found = await prisma.armada.findUnique({
                where: { id: armadaId },
                select: { platNomor: true },
            });
            targetPlate = found?.platNomor;
        }

        if (!targetPlate) {
            return NextResponse.json({ error: 'Data armada tidak ditemukan.' }, { status: 404 });
        }

        const cleanPlate = normalizePlate(targetPlate);
        const allArmadas = await prisma.armada.findMany({
            include: {
                kelurahan: {
                    include: { kecamatan: true }
                }
            }
        });

        const matchingArmadas = allArmadas.filter(
            (a) => normalizePlate(a.platNomor) === cleanPlate
        );

        if (matchingArmadas.length === 0) {
            return NextResponse.json({ error: 'Tidak ditemukan armada dengan nomor polisi tersebut.' }, { status: 404 });
        }

        const matchingIds = matchingArmadas.map((a) => a.id);
        const verifierName = session?.user?.name || session?.user?.email || 'Operator Timbang';

        // Update seluruh record armada yang berbagi plat nomor sama (karena satu fisik armada melayani > 1 LPS)
        await prisma.armada.updateMany({
            where: { id: { in: matchingIds } },
            data: {
                isMultiLpsVerified: isVerified,
                verifiedAt: isVerified ? new Date() : null,
                verifiedBy: isVerified ? verifierName : null,
            },
        });

        const lpsList = matchingArmadas.map(a => a.namaLps).join(', ');

        return NextResponse.json({
            success: true,
            message: isVerified
                ? `Armada ${targetPlate} (melayani: ${lpsList}) berhasil diverifikasi oleh operator. Akses QR di aplikasi TimbangQR (/scan) telah dibuka.`
                : `Verifikasi armada ${targetPlate} berhasil dibatalkan.`,
            platNomor: targetPlate,
            isMultiLpsVerified: isVerified,
            verifiedCount: matchingIds.length,
            lpsList,
            verifiedBy: isVerified ? verifierName : null,
            verifiedAt: isVerified ? new Date().toISOString() : null,
        });
    } catch (error: any) {
        console.error('[POST /api/armada/verify-multi-lps Error]:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Terjadi kesalahan server saat memverifikasi armada'
        }, { status: 500 });
    }
}
