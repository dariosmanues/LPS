import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Ambil semua laporan
export async function GET() {
    try {
        const laporan = await prisma.laporanBulanan.findMany({
            include: {
                kinerjaAngkutan: true,
                kinerjaPengolahan: true,
                kinerjaIuran: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: laporan
        })

    } catch (error) {
        console.error('Get Laporan Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST - Buat laporan baru
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            bulan,
            kelurahan,
            latarBelakang,
            tujuan,
            manfaat,
            strukturLPS,
            layanan,
            perkembanganLPS,
            laporanKeuangan,
            kinerjaAngkutan,
            kinerjaPengolahan,
            kinerjaIuran
        } = body

        // Validasi required fields
        if (!bulan || !kelurahan) {
            return NextResponse.json(
                { success: false, error: 'Bulan dan kelurahan wajib diisi' },
                { status: 400 }
            )
        }

        // Cek apakah laporan untuk bulan dan kelurahan yang sama sudah ada
        const existingLaporan = await prisma.laporanBulanan.findFirst({
            where: {
                bulan,
                kelurahan
            }
        })

        if (existingLaporan) {
            return NextResponse.json(
                { success: false, error: 'Laporan untuk bulan dan kelurahan ini sudah ada' },
                { status: 400 }
            )
        }

        // Buat laporan baru
        const newLaporan = await prisma.laporanBulanan.create({
            data: {
                bulan,
                kelurahan,
                latarBelakang,
                tujuan,
                manfaat,
                strukturLPS,
                layanan,
                perkembanganLPS,
                laporanKeuangan,
                kinerjaAngkutan: kinerjaAngkutan ? {
                    create: {
                        jumlahArmada: kinerjaAngkutan.jumlahArmada,
                        jumlahRumahTangga: typeof kinerjaAngkutan.jumlahRumahTangga === 'object'
                            ? JSON.stringify(kinerjaAngkutan.jumlahRumahTangga)
                            : kinerjaAngkutan.jumlahRumahTangga,
                        jumlahUMKM: kinerjaAngkutan.jumlahUMKM,
                        jumlahBadanUsaha: kinerjaAngkutan.jumlahBadanUsaha,
                        permasalahan: kinerjaAngkutan.permasalahan,
                        aksiYangDilakukan: kinerjaAngkutan.aksiYangDilakukan
                    }
                } : undefined,
                kinerjaPengolahan: kinerjaPengolahan ? {
                    create: {
                        programPengolahan: kinerjaPengolahan.programPengolahan,
                        volumePemilahanOrganik: kinerjaPengolahan.volumePemilahanOrganik,
                        volumePemilahanUnorganik: kinerjaPengolahan.volumePemilahanUnorganik,
                        volumePenjualanOrganik: kinerjaPengolahan.volumePenjualanOrganik,
                        volumePenjualanUnorganik: kinerjaPengolahan.volumePenjualanUnorganik,
                        rincianAnorganik: typeof kinerjaPengolahan.rincianAnorganik === 'object'
                            ? JSON.stringify(kinerjaPengolahan.rincianAnorganik)
                            : kinerjaPengolahan.rincianAnorganik,
                        programEdukasi: kinerjaPengolahan.programEdukasi,
                        permasalahan: kinerjaPengolahan.permasalahan,
                        aksiYangDilakukan: kinerjaPengolahan.aksiYangDilakukan
                    }
                } : undefined,
                kinerjaIuran: kinerjaIuran ? {
                    create: {
                        penerimaanIuran: kinerjaIuran.penerimaanIuran,
                        iuranPerRT: kinerjaIuran.iuranPerRT,
                        penerimaanLain: kinerjaIuran.penerimaanLain,
                        sewaArmada: kinerjaIuran.sewaArmada,
                        bbm: kinerjaIuran.bbm,
                        tenagaKerja: kinerjaIuran.tenagaKerja,
                        administrasi: kinerjaIuran.administrasi,
                        biayaRapat: kinerjaIuran.biayaRapat,
                        feePetugasPungut: kinerjaIuran.feePetugasPungut,
                        gajiPengurus: kinerjaIuran.gajiPengurus,
                        pemanfaatanIuran: kinerjaIuran.pemanfaatanIuran,
                        permasalahan: kinerjaIuran.permasalahan,
                        aksiYangDilakukan: kinerjaIuran.aksiYangDilakukan
                    }
                } : undefined
            },
            include: {
                kinerjaAngkutan: true,
                kinerjaPengolahan: true,
                kinerjaIuran: true
            }
        })

        return NextResponse.json({
            success: true,
            data: newLaporan,
            message: 'Laporan berhasil dibuat'
        })

    } catch (error) {
        console.error('Create Laporan Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
