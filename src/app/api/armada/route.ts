import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncArmadaToTimbangQr, isHarapanJaya } from '@/lib/timbangqr-sync-service';

function parseSafeDate(val: any): Date | null {
    if (!val || val === '' || val === 'null' || val === 'undefined') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

function parseSafeString(val: any): string | null {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (str === '' || str === 'null' || str === 'undefined') return null;
    return str;
}

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

        const search = searchParams.get('search') || searchParams.get('q') || '';

        let where: any = undefined;
        if (search.trim()) {
            const s = search.trim();
            where = {
                OR: [
                    { platNomor: { contains: s, mode: 'insensitive' } },
                    { namaLps: { contains: s, mode: 'insensitive' } },
                    { namaSupir: { contains: s, mode: 'insensitive' } },
                    { noIzinOperasi: { contains: s, mode: 'insensitive' } },
                    { kelurahan: { nama: { contains: s, mode: 'insensitive' } } },
                ]
            };
        }

        const armada = await prisma.armada.findMany({
            where,
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

        const cleanNamaLps = parseSafeString(namaLps);
        const cleanPlatNomor = parseSafeString(platNomor);

        if (!cleanNamaLps || !cleanPlatNomor) {
            return NextResponse.json({ error: 'Nama LPS dan Nomor Plat wajib diisi.' }, { status: 400 });
        }

        let safeKelurahanId: string | null = null;
        if (kelurahanId) {
            const rawId = parseSafeString(kelurahanId);
            if (rawId) {
                const kelExists = await prisma.kelurahan.findUnique({
                    where: { id: rawId },
                    select: { id: true },
                });
                if (kelExists) safeKelurahanId = rawId;
            }
        }

        const qrCode = `LPS-${cleanPlatNomor.replace(/\s/g, '')}-${Date.now()}`;

        const armada = await prisma.armada.create({
            data: {
                namaLps: cleanNamaLps,
                kelurahanId: safeKelurahanId,
                platNomor: cleanPlatNomor,
                noIzinOperasi: parseSafeString(noIzinOperasi),
                namaSupir: parseSafeString(namaSupir),
                namaKetuaLps: parseSafeString(namaKetuaLps),
                noTlpKetuaLps: parseSafeString(noTlpKetuaLps),
                alamatLps: parseSafeString(alamatLps),
                wilayahKerja: parseSafeString(wilayahKerja),
                nomorSkLps: parseSafeString(nomorSkLps),
                tanggalSkLps: parseSafeDate(tanggalSkLps),
                tanggalTerbitIzin: parseSafeDate(tanggalTerbitIzin),
                lokasiTransdepo: parseSafeString(lokasiTransdepo),
                jenisArmada: parseSafeString(jenisArmada),
                qrCode,
            },
            include: {
                kelurahan: {
                    include: { kecamatan: true }
                }
            }
        });

        // Sinkronisasi ke TimbangQR jika lokasi atau wilayah kerja adalah Harapan Jaya
        let timbangQrSync = null;
        if (isHarapanJaya(armada.lokasiTransdepo, armada.wilayahKerja)) {
            try {
                timbangQrSync = await syncArmadaToTimbangQr(armada);
            } catch (syncErr) {
                console.warn('[POST /api/armada] TimbangQR sync warning:', syncErr);
            }
        }

        return NextResponse.json({
            ...armada,
            timbangQrSync
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating armada:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : (error?.message || 'Failed to create armada'),
            code: error?.code,
        }, { status: 500 });
    }
}
