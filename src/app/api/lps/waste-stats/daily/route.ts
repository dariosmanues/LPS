import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
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

        const kelurahan = await prisma.kelurahan.findUnique({
            where: { id: kelurahanId },
            include: { kecamatan: true }
        });

        // Tentukan bulan berjalan dalam WIB (UTC+7)
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const nowWib = new Date(now.getTime() + wibOffset);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth(); // 0-indexed

        // Mulai operasional resmi: 12 Oktober 2026
        const systemStartDateWib = new Date(Date.UTC(2026, 9, 12, -7, 0, 0, 0));
        const startOfMonthWib = new Date(Math.max(Date.UTC(y, m, 1, -7, 0, 0, 0), systemStartDateWib.getTime()));
        const endOfMonthWib = new Date(Date.UTC(y, m + 1, 1, -7, 0, 0, 0));

        const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const logs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: startOfMonthWib,
                    lt: endOfMonthWib
                },
                OR: [
                    { kelurahanId: kelurahanId },
                    { armada: { kelurahanId: kelurahanId } }
                ]
            },
            include: {
                armada: {
                    select: {
                        platNomor: true,
                        namaSupir: true,
                        jenisArmada: true,
                        namaLps: true
                    }
                },
                timbangQrSync: {
                    select: {
                        ticketNumber: true,
                        plateNumber: true,
                        grossKg: true,
                        tareKg: true,
                        nettoKg: true,
                        weighedAt: true
                    }
                }
            },
            orderBy: {
                recordedAt: 'desc'
            }
        });

        // Agregasi per tanggal (harian)
        const dailyMap = new Map<string, { dateStr: string; label: string; day: number; totalKg: number; tripCount: number }>();

        // Siapkan daftar transaksi
        const transactions = logs.map(log => {
            const dateObj = new Date(log.recordedAt);
            const dateWib = new Date(dateObj.getTime() + wibOffset);
            const dayNum = dateWib.getUTCDate();
            const dateStr = dateWib.toISOString().split('T')[0];
            const dateLabel = dateObj.toLocaleDateString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: 'numeric',
                month: 'short'
            });

            const berat = Number(log.beratKg || log.timbangQrSync?.nettoKg || 0);

            // Akumulasi harian
            const currentDaily = dailyMap.get(dateStr) || {
                dateStr,
                label: dateLabel,
                day: dayNum,
                totalKg: 0,
                tripCount: 0
            };
            currentDaily.totalKg += berat;
            currentDaily.tripCount += 1;
            dailyMap.set(dateStr, currentDaily);

            return {
                id: log.id,
                ticketNumber: log.timbangQrSync?.ticketNumber || `LOG-${log.id.slice(0, 8)}`,
                plateNumber: log.armada?.platNomor || log.timbangQrSync?.plateNumber || '-',
                driverName: log.armada?.namaSupir || '-',
                jenisArmada: log.armada?.jenisArmada || 'DUMPTRUCK',
                beratKg: berat,
                grossKg: log.timbangQrSync ? Number(log.timbangQrSync.grossKg) : null,
                tareKg: log.timbangQrSync ? Number(log.timbangQrSync.tareKg) : null,
                recordedAt: log.recordedAt.toISOString(),
                timeFormatted: dateObj.toLocaleTimeString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    hour: '2-digit',
                    minute: '2-digit'
                }) + ' WIB',
                dateFormatted: dateObj.toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }),
                dateStr,
                status: log.status || 'SELESAI'
            };
        });

        // Urutkan dailyData berdasarkan tanggal menaik (untuk chart)
        const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

        const totalKg = transactions.reduce((sum, t) => sum + t.beratKg, 0);
        const totalRitasi = transactions.length;
        const averageKg = totalRitasi > 0 ? Math.round(totalKg / totalRitasi) : 0;

        return NextResponse.json({
            success: true,
            kelurahan: kelurahan ? {
                id: kelurahan.id,
                nama: kelurahan.nama,
                kecamatan: kelurahan.kecamatan?.nama || '-'
            } : null,
            monthLabel,
            stats: {
                totalKg,
                totalRitasi,
                averageKg
            },
            dailyData,
            transactions
        });

    } catch (error) {
        console.error('Error fetching LPS daily waste stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch daily waste stats' },
            { status: 500 }
        );
    }
}
