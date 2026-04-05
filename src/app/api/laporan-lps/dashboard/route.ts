import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Ambil semua laporan
        const laporan = await prisma.laporanBulanan.findMany({
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

        // Hitung statistik
        const totalLaporan = await prisma.laporanBulanan.count()

        // Laporan bulan ini
        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const laporanBulanIni = await prisma.laporanBulanan.count({
            where: {
                bulan: currentMonth
            }
        })

        // Total armada (dari laporan terakhir)
        const totalArmada = laporan.reduce((total, item) => {
            return total + (item.kinerjaAngkutan?.jumlahArmada || 0)
        }, 0)

        // Total rumah tangga (dari JSON string)
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

        const stats = {
            totalLaporan,
            bulanIni: laporanBulanIni,
            totalArmada,
            totalRumahTangga,
            totalUMKM,
            totalBadanUsaha,
            totalPenerimaanIuran
        }

        return NextResponse.json({
            success: true,
            stats,
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
        console.error('Dashboard API Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
