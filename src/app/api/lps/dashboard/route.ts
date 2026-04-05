import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const kelurahanId = session.user.kelurahanId

        if (!kelurahanId) {
            return NextResponse.json(
                { success: false, error: 'User tidak terhubung dengan kelurahan' },
                { status: 400 }
            )
        }

        // Get kelurahan info
        const kelurahan = await prisma.kelurahan.findUnique({
            where: { id: kelurahanId },
            include: { kecamatan: true }
        })

        if (!kelurahan) {
            return NextResponse.json(
                { success: false, error: 'Kelurahan tidak ditemukan' },
                { status: 404 }
            )
        }

        // Ambil laporan untuk kelurahan ini
        const laporan = await prisma.laporanBulanan.findMany({
            where: { kelurahan: kelurahan.nama },
            include: {
                kinerjaAngkutan: true,
                kinerjaPengolahan: true,
                kinerjaIuran: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // 10 laporan terbaru
        })

        // Hitung statistik untuk kelurahan ini
        const totalLaporan = await prisma.laporanBulanan.count({
            where: { kelurahan: kelurahan.nama }
        })

        // Laporan bulan ini
        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const laporanBulanIni = await prisma.laporanBulanan.count({
            where: {
                kelurahan: kelurahan.nama,
                bulan: currentMonth
            }
        })

        // Total armada dari laporan
        const totalArmada = laporan.reduce((total, item) => {
            return total + (item.kinerjaAngkutan?.jumlahArmada || 0)
        }, 0)

        // Total rumah tangga
        const totalRumahTangga = laporan.reduce((total, item) => {
            if (item.kinerjaAngkutan?.jumlahRumahTangga) {
                try {
                    const rtData = JSON.parse(item.kinerjaAngkutan.jumlahRumahTangga)
                    return total + Object.values(rtData).reduce((sum: number, val: unknown) => sum + (typeof val === 'number' ? val : 0), 0)
                } catch {
                    return total
                }
            }
            return total
        }, 0)

        // Total UMKM
        const totalUMKM = laporan.reduce((total, item) => {
            return total + (item.kinerjaAngkutan?.jumlahUMKM || 0)
        }, 0)

        // Total Badan Usaha
        const totalBadanUsaha = laporan.reduce((total, item) => {
            return total + (item.kinerjaAngkutan?.jumlahBadanUsaha || 0)
        }, 0)

        // Total penerimaan iuran
        const totalPenerimaanIuran = laporan.reduce((total, item) => {
            return total + (item.kinerjaIuran?.penerimaanIuran || 0)
        }, 0)

        // Get armada count for this kelurahan
        const armadaCount = await prisma.armada.count({
            where: { kelurahanId: kelurahanId }
        })

        // Get armada details with waste stats for this kelurahan
        const armadas = await prisma.armada.findMany({
            where: { kelurahanId: kelurahanId },
            include: {
                wasteLogs: {
                    select: {
                        beratKg: true
                    }
                }
            }
        })

        const armadaStats = armadas.map(armada => {
            const totalBerat = armada.wasteLogs.reduce((sum, log) => {
                return sum + Number(log.beratKg)
            }, 0)

            return {
                id: armada.id,
                platNomor: armada.platNomor,
                namaSupir: armada.namaSupir || '-',
                jenisArmada: armada.jenisArmada || '-',
                totalBerat: totalBerat
            }
        })

        const stats = {
            totalLaporan,
            bulanIni: laporanBulanIni,
            totalArmada: armadaCount || totalArmada,
            totalRumahTangga,
            totalUMKM,
            totalBadanUsaha,
            totalPenerimaanIuran
        }

        return NextResponse.json({
            success: true,
            kelurahan: {
                id: kelurahan.id,
                nama: kelurahan.nama,
                kecamatan: kelurahan.kecamatan.nama
            },
            stats,
            armadaStats,
            laporan: laporan.map(item => ({
                id: item.id,
                bulan: item.bulan,
                kelurahan: item.kelurahan,
                createdAt: item.createdAt,
                kinerjaAngkutan: item.kinerjaAngkutan ? {
                    jumlahArmada: item.kinerjaAngkutan.jumlahArmada,
                    jumlahUMKM: item.kinerjaAngkutan.jumlahUMKM,
                    jumlahBadanUsaha: item.kinerjaAngkutan.jumlahBadanUsaha
                } : undefined,
                kinerjaIuran: item.kinerjaIuran ? {
                    penerimaanIuran: item.kinerjaIuran.penerimaanIuran
                } : undefined
            }))
        })

    } catch (error) {
        console.error('LPS Dashboard API Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
