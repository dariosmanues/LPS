import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transdepo = searchParams.get('transdepo')?.trim().toUpperCase();
        const kategori = searchParams.get('kategori')?.trim().toUpperCase();
        const search = searchParams.get('search')?.trim();
        const startDate = searchParams.get('startDate')?.trim();
        const endDate = searchParams.get('endDate')?.trim();
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));

        const where: Record<string, any> = {};

        // Filter Transdepo
        if (transdepo && transdepo !== 'ALL') {
            if (transdepo.includes('AIR')) {
                where.transdepo = 'AIR_HITAM';
            } else if (transdepo.includes('HARAPAN')) {
                where.transdepo = 'HARAPAN_JAYA';
            } else {
                where.transdepo = transdepo;
            }
        }

        // Filter Kategori
        if (kategori && kategori !== 'ALL') {
            where.kategoriAlasan = kategori;
        }

        // Filter Tanggal
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                where.createdAt.gte = s;
            }
            if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                where.createdAt.lte = e;
            }
        }

        // Pencarian Teks
        if (search) {
            where.OR = [
                { platNomor: { contains: search, mode: 'insensitive' } },
                { namaLps: { contains: search, mode: 'insensitive' } },
                { kelurahan: { contains: search, mode: 'insensitive' } },
                { kecamatan: { contains: search, mode: 'insensitive' } },
                { qrCode: { contains: search, mode: 'insensitive' } },
                { keterangan: { contains: search, mode: 'insensitive' } },
                { operatorName: { contains: search, mode: 'insensitive' } },
                { tiketNumberRef: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Query data dan agregasi
        const [totalCount, reports, allStats] = await Promise.all([
            prisma.qrFailureReport.count({ where }),
            prisma.qrFailureReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit,
            }),
            prisma.qrFailureReport.groupBy({
                by: ['kategoriAlasan', 'transdepo'],
                _count: { id: true },
            }),
        ]);

        // Hitung Summary Statistik KPI
        let totalHangus = 0;
        let totalUsang = 0;
        let totalKadaluarsa = 0;
        let totalTidakTerdaftar = 0;
        let totalPlatTidakSesuai = 0;
        let totalLainnya = 0;
        let totalAirHitam = 0;
        let totalHarapanJaya = 0;

        for (const stat of allStats) {
            const count = stat._count.id;
            if (stat.kategoriAlasan === 'HANGUS') totalHangus += count;
            else if (stat.kategoriAlasan === 'USANG') totalUsang += count;
            else if (stat.kategoriAlasan === 'KADALUARSA') totalKadaluarsa += count;
            else if (stat.kategoriAlasan === 'TIDAK_TERDAFTAR') totalTidakTerdaftar += count;
            else if (stat.kategoriAlasan === 'PLAT_TIDAK_SESUAI') totalPlatTidakSesuai += count;
            else totalLainnya += count;

            if (stat.transdepo === 'AIR_HITAM') totalAirHitam += count;
            else if (stat.transdepo === 'HARAPAN_JAYA') totalHarapanJaya += count;
        }

        const totalAll = totalAirHitam + totalHarapanJaya;

        return NextResponse.json({
            success: true,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            summary: {
                totalAll,
                totalAirHitam,
                totalHarapanJaya,
                totalHangus,
                totalUsang,
                totalKadaluarsa,
                totalTidakTerdaftar,
                totalPlatTidakSesuai,
                totalLainnya,
            },
            data: reports,
        });
    } catch (error) {
        console.error('Error fetching QR failure reports:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data rekapitulasi kegagalan scan QR' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            transdepo,
            platNomor,
            namaLps,
            kelurahan,
            kecamatan,
            qrCode,
            kategoriAlasan,
            keterangan,
            tindakan,
            operatorName,
            tiketNumberRef,
            fotoKondisiUrl,
        } = body;

        if (!transdepo || !kategoriAlasan) {
            return NextResponse.json(
                { error: 'Lokasi transdepo dan kategori alasan wajib diisi.' },
                { status: 400 }
            );
        }

        const normalizedTransdepo = transdepo.toUpperCase().includes('HARAPAN')
            ? 'HARAPAN_JAYA'
            : 'AIR_HITAM';

        const newReport = await prisma.qrFailureReport.create({
            data: {
                id: crypto.randomUUID(),
                transdepo: normalizedTransdepo,
                platNomor: platNomor ? String(platNomor).toUpperCase().trim() : null,
                namaLps: namaLps ? String(namaLps).trim() : null,
                kelurahan: kelurahan ? String(kelurahan).trim() : null,
                kecamatan: kecamatan ? String(kecamatan).trim() : null,
                qrCode: qrCode ? String(qrCode).trim() : null,
                kategoriAlasan: String(kategoriAlasan).toUpperCase().trim(),
                keterangan: keterangan ? String(keterangan).trim() : null,
                tindakan: tindakan ? String(tindakan).trim() : 'TIDAK_DITIMBANG',
                operatorName: operatorName ? String(operatorName).trim() : 'Petugas Pos Timbangan',
                tiketNumberRef: tiketNumberRef ? String(tiketNumberRef).trim() : null,
                fotoKondisiUrl: fotoKondisiUrl ? String(fotoKondisiUrl).trim() : null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Laporan kendala QR berhasil dicatat.',
            data: newReport,
        });
    } catch (error) {
        console.error('Error creating QR failure report:', error);
        return NextResponse.json(
            { error: 'Gagal menyimpan laporan kendala QR.' },
            { status: 500 }
        );
    }
}

