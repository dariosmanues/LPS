import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Ambil laporan by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const laporan = await prisma.laporanBulanan.findUnique({
            where: {
                id: id
            },
            include: {
                kinerjaAngkutan: true,
                kinerjaPengolahan: true,
                kinerjaIuran: true
            }
        })

        if (!laporan) {
            return NextResponse.json(
                { success: false, error: 'Laporan tidak ditemukan' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: laporan
        })

    } catch (error) {
        console.error('Get Laporan by ID Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT - Update laporan
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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

        // Cek apakah laporan ada
        const existingLaporan = await prisma.laporanBulanan.findUnique({
            where: { id: id }
        })

        if (!existingLaporan) {
            return NextResponse.json(
                { success: false, error: 'Laporan tidak ditemukan' },
                { status: 404 }
            )
        }

        // Update laporan
        const updatedLaporan = await prisma.laporanBulanan.update({
            where: { id: id },
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
                    upsert: {
                        create: {
                            jumlahArmada: kinerjaAngkutan.jumlahArmada,
                            jumlahRumahTangga: typeof kinerjaAngkutan.jumlahRumahTangga === 'object'
                                ? JSON.stringify(kinerjaAngkutan.jumlahRumahTangga)
                                : kinerjaAngkutan.jumlahRumahTangga,
                            jumlahUMKM: kinerjaAngkutan.jumlahUMKM,
                            jumlahBadanUsaha: kinerjaAngkutan.jumlahBadanUsaha,
                            permasalahan: kinerjaAngkutan.permasalahan,
                            aksiYangDilakukan: kinerjaAngkutan.aksiYangDilakukan
                        },
                        update: {
                            jumlahArmada: kinerjaAngkutan.jumlahArmada,
                            jumlahRumahTangga: typeof kinerjaAngkutan.jumlahRumahTangga === 'object'
                                ? JSON.stringify(kinerjaAngkutan.jumlahRumahTangga)
                                : kinerjaAngkutan.jumlahRumahTangga,
                            jumlahUMKM: kinerjaAngkutan.jumlahUMKM,
                            jumlahBadanUsaha: kinerjaAngkutan.jumlahBadanUsaha,
                            permasalahan: kinerjaAngkutan.permasalahan,
                            aksiYangDilakukan: kinerjaAngkutan.aksiYangDilakukan
                        }
                    }
                } : undefined,
                kinerjaPengolahan: kinerjaPengolahan ? {
                    upsert: {
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
                        },
                        update: {
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
                    }
                } : undefined,
                kinerjaIuran: kinerjaIuran ? {
                    upsert: {
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
                        },
                        update: {
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
            data: updatedLaporan,
            message: 'Laporan berhasil diperbarui'
        })

    } catch (error) {
        console.error('Update Laporan Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE - Hapus laporan
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Cek apakah laporan ada
        const existingLaporan = await prisma.laporanBulanan.findUnique({
            where: { id: id }
        })

        if (!existingLaporan) {
            return NextResponse.json(
                { success: false, error: 'Laporan tidak ditemukan' },
                { status: 404 }
            )
        }

        // Hapus laporan (cascade akan menghapus relasi)
        await prisma.laporanBulanan.delete({
            where: { id: id }
        })

        return NextResponse.json({
            success: true,
            message: 'Laporan berhasil dihapus'
        })

    } catch (error) {
        console.error('Delete Laporan Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
