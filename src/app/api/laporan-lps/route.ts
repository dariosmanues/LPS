import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // In a real application, you would get the kelurahanId from the user's session
    // For now, we'll fetch the first kelurahan or use a provided one.
    let kelurahanId = data.kelurahanId
    
    if (!kelurahanId) {
        return NextResponse.json({ success: false, error: 'Kelurahan wajib dipilih.' }, { status: 400 })
    }

    // Format nested data for Prisma
    const rumahTanggaCreate = Object.entries(data.kinerjaAngkutan?.jumlahRumahTangga || {}).map(([rtRw, item]) => ({
      rtRw,
      jumlah: Number((item as any).jumlah),
      hari: String((item as any).hari || '')
    }))

    const rincianAnorganikCreate = Object.entries(data.kinerjaPengolahan?.rincianAnorganik || {}).map(([kategori, volume]) => ({
      kategori,
      volume: Number(volume)
    }))

    const iuranRWCreate = Array.isArray(data.kinerjaIuran?.iuranPerRW)
        ? data.kinerjaIuran.iuranPerRW.map((item: any) => ({
            rw: String(item.rw || ''),
            nilai: Number(item.nilai || 0)
          }))
        : []

    const laporan = await prisma.laporan.create({
      data: {
        bulan: data.bulan,
        kelurahanId: kelurahanId,
        latarBelakang: data.latarBelakang || '',
        tujuan: data.tujuan || '',
        manfaat: data.manfaat || '',
        strukturLPS: data.strukturLPS || '',
        layanan: data.layanan || '',
        perkembanganLPS: data.perkembanganLPS || '',
        laporanKeuangan: data.laporanKeuangan || '',

        kinerjaAngkutan: {
          create: {
            jumlahArmada: Number(data.kinerjaAngkutan?.jumlahArmada || 0),
            jumlahUMKM: Number(data.kinerjaAngkutan?.jumlahUMKM || 0),
            jumlahBadanUsaha: Number(data.kinerjaAngkutan?.jumlahBadanUsaha || 0),
            persentasePartisipasi: Number(data.kinerjaAngkutan?.persentasePartisipasi || 0),
            permasalahan: data.kinerjaAngkutan?.permasalahan || '',
            aksiYangDilakukan: data.kinerjaAngkutan?.aksiYangDilakukan || '',
            rumahTangga: {
              create: rumahTanggaCreate
            }
          }
        },

        kinerjaPengolahan: {
          create: {
            programPengolahan: data.kinerjaPengolahan?.programPengolahan || '',
            volumePemilahanOrganik: Number(data.kinerjaPengolahan?.volumePemilahanOrganik || 0),
            volumePemilahanUnorganik: Number(data.kinerjaPengolahan?.volumePemilahanUnorganik || 0),
            volumePenjualanOrganik: Number(data.kinerjaPengolahan?.volumePenjualanOrganik || 0),
            volumePenjualanUnorganik: Number(data.kinerjaPengolahan?.volumePenjualanUnorganik || 0),
            programEdukasi: data.kinerjaPengolahan?.programEdukasi || '',
            permasalahan: data.kinerjaPengolahan?.permasalahan || '',
            aksiYangDilakukan: data.kinerjaPengolahan?.aksiYangDilakukan || '',
            rincianAnorganik: {
              create: rincianAnorganikCreate
            }
          }
        },

        kinerjaIuran: {
          create: {
            penerimaanIuran: Number(data.kinerjaIuran?.penerimaanIuran || 0),
            iuranPerRW: {
              create: iuranRWCreate
            },
            nilaiIuran: Array.isArray(data.kinerjaIuran?.nilaiIuran) 
                ? data.kinerjaIuran.nilaiIuran.map(Number) 
                : [],
            penerimaanLain: Number(data.kinerjaIuran?.penerimaanLain || 0),
            sewaArmada: Number(data.kinerjaIuran?.sewaArmada || 0),
            bbm: Number(data.kinerjaIuran?.bbm || 0),
            tenagaKerja: Number(data.kinerjaIuran?.tenagaKerja || 0),
            administrasi: Number(data.kinerjaIuran?.administrasi || 0),
            biayaRapat: Number(data.kinerjaIuran?.biayaRapat || 0),
            feePetugasPungut: Number(data.kinerjaIuran?.feePetugasPungut || 0),
            gajiPengurus: Number(data.kinerjaIuran?.gajiPengurus || 0),
            biayaLainLain: Number(data.kinerjaIuran?.biayaLainLain || 0),
            pemanfaatanIuran: data.kinerjaIuran?.pemanfaatanIuran || '',
            permasalahan: data.kinerjaIuran?.permasalahan || '',
            aksiYangDilakukan: data.kinerjaIuran?.aksiYangDilakukan || ''
          }
        }
      }
    })

    return NextResponse.json({ success: true, laporan })
  } catch (error) {
    console.error('Failed to submit laporan:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const laporan = await prisma.laporan.findMany({
      include: {
        kelurahan: true,
        kinerjaAngkutan: {
          include: { rumahTangga: true }
        },
        kinerjaPengolahan: {
          include: { rincianAnorganik: true }
        },
        kinerjaIuran: {
          include: { iuranPerRW: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json({ success: true, data: laporan })
  } catch (error) {
    console.error('Failed to fetch laporan:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
