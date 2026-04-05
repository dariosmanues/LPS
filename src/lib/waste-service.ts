import { prisma } from '@/lib/prisma';
import { WasteStatus } from '@prisma/client';

interface ScanInput {
    armadaQrCode: string;
    kelurahanQrCode?: string;
    beratKg: number;
    status: 'MASUK' | 'KELUAR';
    userId: string;
}

interface ScanResult {
    success: boolean;
    message: string;
    data?: {
        logId: string;
        armada: { platNomor: string; driver: string | null };
        kelurahan?: { nama: string; kecamatan: string };
        beratKg: number;
        status: string;
        timestamp: Date;
    };
}

export async function processWasteScan(input: ScanInput): Promise<ScanResult> {
    try {
        // 1. Validate Armada QR Code
        const armada = await prisma.armada.findUnique({
            where: { qrCode: input.armadaQrCode }
        });

        if (!armada) {
            return {
                success: false,
                message: 'QR Code Armada tidak valid'
            };
        }

        if (!armada.isActive) {
            return {
                success: false,
                message: 'Armada tidak aktif'
            };
        }

        // 2. Validate Kelurahan QR Code (optional)
        let kelurahan = null;
        if (input.kelurahanQrCode) {
            kelurahan = await prisma.kelurahan.findUnique({
                where: { qrCode: input.kelurahanQrCode },
                include: { kecamatan: true }
            });

            if (!kelurahan) {
                return {
                    success: false,
                    message: 'QR Code Kelurahan tidak valid'
                };
            }
        }

        // 3. Validate weight
        if (input.beratKg <= 0) {
            return {
                success: false,
                message: 'Berat sampah harus lebih dari 0 kg'
            };
        }

        // 4. Create waste log
        const wasteLog = await prisma.wasteLog.create({
            data: {
                armadaId: armada.id,
                kelurahanId: kelurahan?.id,
                recordedBy: input.userId,
                beratKg: input.beratKg,
                status: input.status as WasteStatus,
                metadata: JSON.stringify({
                    scannedAt: new Date().toISOString(),
                    deviceInfo: 'mobile-app'
                })
            }
        });

        return {
            success: true,
            message: `Data berhasil disimpan - ${input.status}`,
            data: {
                logId: wasteLog.id,
                armada: {
                    platNomor: armada.platNomor,
                    driver: armada.namaSupir
                },
                kelurahan: kelurahan ? {
                    nama: kelurahan.nama,
                    kecamatan: kelurahan.kecamatan.nama
                } : undefined,
                beratKg: input.beratKg,
                status: input.status,
                timestamp: wasteLog.recordedAt
            }
        };
    } catch (error) {
        console.error('Error processing waste scan:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan sistem'
        };
    }
}

export async function getWasteReportByKecamatan(startDate: Date, endDate: Date) {
    const result = await prisma.kecamatan.findMany({
        select: {
            id: true,
            nama: true,
            kodeKemendagri: true,
            kelurahan: {
                select: {
                    id: true,
                    nama: true,
                    wasteLogs: {
                        where: {
                            recordedAt: {
                                gte: startDate,
                                lte: endDate
                            }
                        },
                        select: {
                            beratKg: true,
                            status: true
                        }
                    }
                }
            }
        }
    });

    return result.map(kec => {
        let totalBerat = 0;
        let totalTransaksi = 0;

        kec.kelurahan.forEach(kel => {
            kel.wasteLogs.forEach(log => {
                totalBerat += Number(log.beratKg);
                totalTransaksi++;
            });
        });

        return {
            kecamatan: kec.nama,
            kode: kec.kodeKemendagri,
            totalTransaksi,
            totalBeratKg: totalBerat,
            rataRataBerat: totalTransaksi > 0 ? totalBerat / totalTransaksi : 0
        };
    }).sort((a, b) => b.totalBeratKg - a.totalBeratKg);
}

export async function getWasteReportByArmada(startDate: Date, endDate: Date) {
    return prisma.armada.findMany({
        where: { isActive: true },
        select: {
            id: true,
            platNomor: true,
            namaSupir: true,
            wasteLogs: {
                where: {
                    recordedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    beratKg: true,
                    status: true,
                    recordedAt: true
                }
            }
        }
    });
}

export async function getRecentLogs(limit: number = 20) {
    return prisma.wasteLog.findMany({
        take: limit,
        orderBy: { recordedAt: 'desc' },
        include: {
            armada: { select: { platNomor: true, namaSupir: true } },
            kelurahan: {
                select: {
                    nama: true,
                    kecamatan: { select: { nama: true } }
                }
            },
            user: { select: { name: true } }
        }
    });
}
