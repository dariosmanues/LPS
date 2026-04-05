import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'createdAt';

        let orderBy: any = { createdAt: 'desc' };

        // Sort by kelurahan name if requested
        if (sortBy === 'kelurahan') {
            orderBy = {
                kelurahan: {
                    nama: 'asc'
                }
            };
        } else if (sortBy === 'namaLps') {
            orderBy = { namaLps: 'asc' };
        } else if (sortBy === 'platNomor') {
            orderBy = { platNomor: 'asc' };
        }

        const armada = await prisma.armada.findMany({
            orderBy,
            include: {
                kelurahan: {
                    select: {
                        nama: true,
                        kecamatan: {
                            select: { nama: true }
                        }
                    }
                }
            }
        });
        return NextResponse.json(armada);
    } catch (error) {
        console.error('Error fetching armada:', error);
        return NextResponse.json({ error: 'Failed to fetch armada' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            namaLps, kelurahanId, platNomor, noIzinOperasi,
            namaSupir, namaKetuaLps, noTlpKetuaLps,
            alamatLps, wilayahKerja, nomorSkLps, tanggalSkLps, tanggalTerbitIzin,
            lokasiTransdepo, jenisArmada
        } = body;

        if (!namaLps || !platNomor) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const qrCode = `LPS-${platNomor.replace(/\s/g, '')}-${Date.now()}`;

        const armada = await prisma.armada.create({
            data: {
                namaLps,
                kelurahanId: kelurahanId || null,
                platNomor,
                noIzinOperasi: noIzinOperasi || null,
                namaSupir: namaSupir || null,
                namaKetuaLps: namaKetuaLps || null,
                noTlpKetuaLps: noTlpKetuaLps || null,
                alamatLps: alamatLps || null,
                wilayahKerja: wilayahKerja || null,
                nomorSkLps: nomorSkLps || null,
                tanggalSkLps: tanggalSkLps ? new Date(tanggalSkLps) : null,
                tanggalTerbitIzin: tanggalTerbitIzin ? new Date(tanggalTerbitIzin) : null,
                lokasiTransdepo: lokasiTransdepo || null,
                jenisArmada: jenisArmada || null,
                qrCode,
            },
        });

        return NextResponse.json(armada, { status: 201 });
    } catch (error) {
        console.error('Error creating armada:', error);
        return NextResponse.json({ error: 'Failed to create armada' }, { status: 500 });
    }
}
