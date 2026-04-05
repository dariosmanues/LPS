import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface KecamatanWithLogs {
    nama: string;
    kelurahan: {
        wasteLogs: {
            beratKg: { toNumber(): number } | number;
        }[];
    }[];
}

interface ArmadaWithLogs {
    platNomor: string;
    namaSupir: string;
    wasteLogs: {
        beratKg: { toNumber(): number } | number;
    }[];
}

interface KecamatanReport {
    kecamatan: string;
    totalBeratKg: number;
    totalTransaksi: number;
}

interface ArmadaReport {
    platNomor: string;
    driverName: string;
    totalBerat: number;
    totalTrips: number;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'today';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        default: // today
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
    }

    try {
        // Get all kecamatan with waste logs
        const kecamatanData = await prisma.kecamatan.findMany({
            select: {
                nama: true,
                kelurahan: {
                    select: {
                        wasteLogs: {
                            where: {
                                recordedAt: {
                                    gte: startDate,
                                    lte: now,
                                },
                            },
                            select: {
                                beratKg: true,
                            },
                        },
                    },
                },
            },
        });

        // Process kecamatan data
        const byKecamatan: KecamatanReport[] = (kecamatanData as KecamatanWithLogs[])
            .map((kec) => {
                let totalBeratKg = 0;
                let totalTransaksi = 0;

                kec.kelurahan.forEach((kel) => {
                    kel.wasteLogs.forEach((log) => {
                        const berat = typeof log.beratKg === 'number' ? log.beratKg : Number(log.beratKg);
                        totalBeratKg += berat;
                        totalTransaksi++;
                    });
                });

                return {
                    kecamatan: kec.nama,
                    totalBeratKg,
                    totalTransaksi,
                };
            })
            .filter((k) => k.totalTransaksi > 0)
            .sort((a, b) => b.totalBeratKg - a.totalBeratKg);

        // Get armada performance
        const armadaData = await prisma.armada.findMany({
            where: { isActive: true },
            select: {
                platNomor: true,
                namaSupir: true,
                wasteLogs: {
                    where: {
                        recordedAt: {
                            gte: startDate,
                            lte: now,
                        },
                    },
                    select: {
                        beratKg: true,
                    },
                },
            },
        });

        const byArmada: ArmadaReport[] = (armadaData as ArmadaWithLogs[])
            .map((armada) => ({
                platNomor: armada.platNomor,
                driverName: armada.namaSupir,
                totalBerat: armada.wasteLogs.reduce((acc: number, log) => {
                    const berat = typeof log.beratKg === 'number' ? log.beratKg : Number(log.beratKg);
                    return acc + berat;
                }, 0),
                totalTrips: armada.wasteLogs.length,
            }))
            .filter((a) => a.totalTrips > 0)
            .sort((a, b) => b.totalBerat - a.totalBerat);

        return NextResponse.json({
            byKecamatan,
            byArmada,
            dateRange: {
                start: startDate.toISOString(),
                end: now.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error generating reports:', error);
        return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 });
    }
}
