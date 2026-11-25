import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/permissions';
import { isTimbangQrAuthorized } from '@/lib/timbangqr-qr-service';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function toWibDate(d: Date): Date {
    return new Date(d.getTime() + WIB_OFFSET_MS);
}

function formatWibYmd(d: Date): string {
    const w = toWibDate(d);
    const y = w.getUTCFullYear();
    const m = String(w.getUTCMonth() + 1).padStart(2, '0');
    const day = String(w.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDailyLabel(ymd: string): { label: string; fullLabel: string } {
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
    const dayName = DAY_NAMES_ID[dt.getUTCDay()] || '';
    const monthName = MONTH_NAMES_SHORT[(m || 1) - 1] || '';
    return {
        label: `${String(d).padStart(2, '0')} ${monthName}`,
        fullLabel: `${dayName}, ${String(d).padStart(2, '0')} ${monthName} ${y}`,
    };
}

export interface TimelineBucket {
    key: string;
    label: string;
    fullLabel: string;
    total: number;
    airHitam: number;
    harapanJaya: number;
    hangus: number;
    usang: number;
    kadaluarsa: number;
    tidakTerdaftar: number;
    platTidakSesuai: number;
    lainnya: number;
}

function createEmptyBucket(key: string, label: string, fullLabel: string): TimelineBucket {
    return {
        key,
        label,
        fullLabel,
        total: 0,
        airHitam: 0,
        harapanJaya: 0,
        hangus: 0,
        usang: 0,
        kadaluarsa: 0,
        tidakTerdaftar: 0,
        platTidakSesuai: 0,
        lainnya: 0,
    };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transdepo = searchParams.get('transdepo')?.trim().toUpperCase();
        const kategori = searchParams.get('kategori')?.trim().toUpperCase();
        const search = searchParams.get('search')?.trim();
        const startDate = searchParams.get('startDate')?.trim();
        const endDate = searchParams.get('endDate')?.trim();
        const rawGranularity = searchParams.get('granularity')?.trim().toLowerCase();
        const isExport = searchParams.get('export') === 'true' || searchParams.get('limit') === 'all';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limitParam = searchParams.get('limit');
        const limit = isExport
            ? undefined
            : Math.min(100, Math.max(1, parseInt(limitParam || '25', 10)));

        const where: Record<string, any> = {};
        const statsWhere: Record<string, any> = {};

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

        // Filter Tanggal (Akurat WIB +07:00)
        if (startDate || endDate) {
            const dateFilter: Record<string, Date> = {};
            if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
                dateFilter.gte = new Date(`${startDate}T00:00:00.000+07:00`);
            } else if (startDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                dateFilter.gte = s;
            }
            if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
                dateFilter.lte = new Date(`${endDate}T23:59:59.999+07:00`);
            } else if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                dateFilter.lte = e;
            }
            where.createdAt = dateFilter;
            statsWhere.createdAt = dateFilter;
        }

        // Pencarian Teks
        if (search) {
            const searchOr = [
                { platNomor: { contains: search, mode: 'insensitive' } },
                { namaLps: { contains: search, mode: 'insensitive' } },
                { kelurahan: { contains: search, mode: 'insensitive' } },
                { kecamatan: { contains: search, mode: 'insensitive' } },
                { qrCode: { contains: search, mode: 'insensitive' } },
                { keterangan: { contains: search, mode: 'insensitive' } },
                { operatorName: { contains: search, mode: 'insensitive' } },
                { tiketNumberRef: { contains: search, mode: 'insensitive' } },
            ];
            where.OR = searchOr;
            statsWhere.OR = searchOr;
        }

        // Query data, agregasi KPI, dan raw timeline
        const [totalCount, reports, allStats, timelineRecords] = await Promise.all([
            prisma.qrFailureReport.count({ where }),
            prisma.qrFailureReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                ...(isExport
                    ? {}
                    : {
                          take: limit,
                          skip: (page - 1) * (limit || 25),
                      }),
            }),
            prisma.qrFailureReport.groupBy({
                by: ['kategoriAlasan', 'transdepo'],
                where: statsWhere,
                _count: { id: true },
            }),
            prisma.qrFailureReport.findMany({
                where,
                select: {
                    createdAt: true,
                    transdepo: true,
                    kategoriAlasan: true,
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        // Tentukan granularity otomatis jika auto / tidak diisi
        const isSingleDay = Boolean(startDate && endDate && startDate === endDate);
        const granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' =
            rawGranularity === 'hourly' || rawGranularity === 'daily' || rawGranularity === 'weekly' || rawGranularity === 'monthly'
                ? rawGranularity
                : isSingleDay
                  ? 'hourly'
                  : 'daily';

        // Bangun Bucket Timeline
        const bucketMap = new Map<string, TimelineBucket>();

        if (granularity === 'hourly') {
            const targetYmd = startDate || (timelineRecords.length > 0 ? formatWibYmd(timelineRecords[timelineRecords.length - 1].createdAt) : formatWibYmd(new Date()));
            if (isSingleDay || !startDate || startDate === endDate) {
                const { fullLabel: dayTitle } = formatDailyLabel(targetYmd);
                for (let h = 0; h < 24; h++) {
                    const hh = String(h).padStart(2, '0');
                    const key = `${targetYmd} ${hh}:00`;
                    bucketMap.set(key, createEmptyBucket(key, `${hh}:00`, `${dayTitle} • Pukul ${hh}:00 - ${hh}:59 WIB`));
                }
            }
        } else if (granularity === 'daily') {
            let rangeStartYmd = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : null;
            let rangeEndYmd = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : null;

            if (!rangeStartYmd && timelineRecords.length > 0) {
                rangeStartYmd = formatWibYmd(timelineRecords[0].createdAt);
            }
            if (!rangeEndYmd && timelineRecords.length > 0) {
                rangeEndYmd = formatWibYmd(timelineRecords[timelineRecords.length - 1].createdAt);
            }

            if (rangeStartYmd && rangeEndYmd && rangeStartYmd <= rangeEndYmd) {
                const startMs = new Date(`${rangeStartYmd}T00:00:00.000Z`).getTime();
                const endMs = new Date(`${rangeEndYmd}T00:00:00.000Z`).getTime();
                const diffDays = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000));
                if (diffDays >= 0 && diffDays <= 90) {
                    for (let i = 0; i <= diffDays; i++) {
                        const cur = new Date(startMs + i * 24 * 60 * 60 * 1000);
                        const ymd = cur.toISOString().slice(0, 10);
                        const { label, fullLabel } = formatDailyLabel(ymd);
                        bucketMap.set(ymd, createEmptyBucket(ymd, label, fullLabel));
                    }
                }
            }
        }

        for (const rec of timelineRecords) {
            const wib = toWibDate(rec.createdAt);
            const y = wib.getUTCFullYear();
            const m = wib.getUTCMonth() + 1;
            const d = wib.getUTCDate();
            const hh = String(wib.getUTCHours()).padStart(2, '0');
            const ymd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            let key = ymd;
            let label = '';
            let fullLabel = '';

            if (granularity === 'hourly') {
                key = `${ymd} ${hh}:00`;
                const { label: dShort, fullLabel: dFull } = formatDailyLabel(ymd);
                label = isSingleDay ? `${hh}:00` : `${dShort} ${hh}:00`;
                fullLabel = `${dFull} • Pukul ${hh}:00 - ${hh}:59 WIB`;
            } else if (granularity === 'daily') {
                key = ymd;
                const fmt = formatDailyLabel(ymd);
                label = fmt.label;
                fullLabel = fmt.fullLabel;
            } else if (granularity === 'weekly') {
                // Start of week (Senin)
                const dayOfWeek = wib.getUTCDay(); // 0=Minggu, 1=Senin
                const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(Date.UTC(y, m - 1, d + diffToMonday));
                const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
                const mYmd = monday.toISOString().slice(0, 10);
                const sYmd = sunday.toISOString().slice(0, 10);
                const mFmt = formatDailyLabel(mYmd);
                const sFmt = formatDailyLabel(sYmd);
                key = mYmd;
                label = `${mFmt.label} - ${sFmt.label}`;
                fullLabel = `Minggu (${mFmt.fullLabel} s/d ${sFmt.fullLabel})`;
            } else {
                // monthly
                const mm = String(m).padStart(2, '0');
                const mName = MONTH_NAMES_SHORT[m - 1] || mm;
                key = `${y}-${mm}`;
                label = `${mName} ${y}`;
                fullLabel = `Bulan ${mName} ${y}`;
            }

            let bucket = bucketMap.get(key);
            if (!bucket) {
                bucket = createEmptyBucket(key, label, fullLabel);
                bucketMap.set(key, bucket);
            }

            bucket.total += 1;
            if (rec.transdepo === 'AIR_HITAM') bucket.airHitam += 1;
            else if (rec.transdepo === 'HARAPAN_JAYA') bucket.harapanJaya += 1;

            if (rec.kategoriAlasan === 'HANGUS') bucket.hangus += 1;
            else if (rec.kategoriAlasan === 'USANG') bucket.usang += 1;
            else if (rec.kategoriAlasan === 'KADALUARSA') bucket.kadaluarsa += 1;
            else if (rec.kategoriAlasan === 'TIDAK_TERDAFTAR') bucket.tidakTerdaftar += 1;
            else if (rec.kategoriAlasan === 'PLAT_TIDAK_SESUAI') bucket.platTidakSesuai += 1;
            else bucket.lainnya += 1;
        }

        const timeline = Array.from(bucketMap.values()).sort((a, b) => a.key.localeCompare(b.key));

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
            granularity,
            pagination: {
                page: isExport ? 1 : page,
                limit: isExport ? totalCount : (limit || 25),
                totalCount,
                totalPages: isExport ? 1 : Math.ceil(totalCount / (limit || 25)),
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
            timeline,
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
        const isSystemAuto =
            isTimbangQrAuthorized(request) ||
            body?.operatorName === 'Sistem Timbangan (Auto)';

        if (!isSystemAuto) {
            const auth = await requireSuperAdmin();
            if (!auth.authorized) return auth.response;
        }

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
                operatorName: operatorName ? String(operatorName).trim() : 'Super Admin',
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

export async function PUT(request: NextRequest) {
    try {
        const auth = await requireSuperAdmin();
        if (!auth.authorized) return auth.response;

        const body = await request.json();
        const {
            id,
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

        if (!id) {
            return NextResponse.json(
                { error: 'ID laporan kendala QR wajib disertakan.' },
                { status: 400 }
            );
        }

        if (!transdepo || !kategoriAlasan) {
            return NextResponse.json(
                { error: 'Lokasi transdepo dan kategori alasan wajib diisi.' },
                { status: 400 }
            );
        }

        const existing = await prisma.qrFailureReport.findUnique({ where: { id: String(id) } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Data laporan kendala QR tidak ditemukan.' },
                { status: 404 }
            );
        }

        const normalizedTransdepo = String(transdepo).toUpperCase().includes('HARAPAN')
            ? 'HARAPAN_JAYA'
            : 'AIR_HITAM';

        const updatedReport = await prisma.qrFailureReport.update({
            where: { id: String(id) },
            data: {
                transdepo: normalizedTransdepo,
                platNomor: platNomor ? String(platNomor).toUpperCase().trim() : null,
                namaLps: namaLps ? String(namaLps).trim() : null,
                kelurahan: kelurahan ? String(kelurahan).trim() : null,
                kecamatan: kecamatan ? String(kecamatan).trim() : null,
                qrCode: qrCode ? String(qrCode).trim() : null,
                kategoriAlasan: String(kategoriAlasan).toUpperCase().trim(),
                keterangan: keterangan ? String(keterangan).trim() : null,
                tindakan: tindakan ? String(tindakan).trim() : 'TIDAK_DITIMBANG',
                operatorName: operatorName ? String(operatorName).trim() : existing.operatorName,
                tiketNumberRef: tiketNumberRef ? String(tiketNumberRef).trim() : null,
                ...(fotoKondisiUrl !== undefined
                    ? { fotoKondisiUrl: fotoKondisiUrl ? String(fotoKondisiUrl).trim() : null }
                    : {}),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Laporan kendala QR berhasil diperbarui.',
            data: updatedReport,
        });
    } catch (error) {
        console.error('Error updating QR failure report:', error);
        return NextResponse.json(
            { error: 'Gagal memperbarui laporan kendala QR.' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireSuperAdmin();
        if (!auth.authorized) return auth.response;

        const { searchParams } = new URL(request.url);
        let id = searchParams.get('id')?.trim();

        if (!id) {
            const body = await request.json().catch(() => null);
            id = body?.id ? String(body.id).trim() : undefined;
        }

        if (!id) {
            return NextResponse.json(
                { error: 'ID laporan kendala QR yang akan dihapus wajib disertakan.' },
                { status: 400 }
            );
        }

        const existing = await prisma.qrFailureReport.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Data laporan kendala QR tidak ditemukan.' },
                { status: 404 }
            );
        }

        await prisma.qrFailureReport.delete({ where: { id } });

        return NextResponse.json({
            success: true,
            message: 'Laporan kendala QR berhasil dihapus.',
        });
    } catch (error) {
        console.error('Error deleting QR failure report:', error);
        return NextResponse.json(
            { error: 'Gagal menghapus laporan kendala QR.' },
            { status: 500 }
        );
    }
}

