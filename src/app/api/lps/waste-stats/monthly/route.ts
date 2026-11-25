import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SYSTEM_START_YMD = '2026-10-12';
const SYSTEM_START_DATE = new Date('2026-10-12T00:00:00.000+07:00');
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
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

function createEmptyBucket(key: string, label: string, fullLabel: string) {
    return {
        key,
        month: label,
        label,
        fullLabel,
        totalKg: 0,
        totalTon: 0,
        airHitamKg: 0,
        harapanJayaKg: 0,
        tripCount: 0,
        airHitamTrips: 0,
        harapanJayaTrips: 0,
    };
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let kelurahanId = session.user.kelurahanId;

        if (!kelurahanId) {
            const dbUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        ...(session.user.id ? [{ id: session.user.id }] : []),
                        ...(session.user.email ? [{ email: session.user.email }] : []),
                    ],
                },
                select: { kelurahanId: true },
            });
            if (dbUser?.kelurahanId) {
                kelurahanId = dbUser.kelurahanId;
            }
        }

        if (!kelurahanId) {
            return NextResponse.json(
                { success: false, error: 'User tidak terhubung dengan kelurahan' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate')?.trim() || '';
        const endDateParam = searchParams.get('endDate')?.trim() || '';
        const rawGranularity = searchParams.get('granularity')?.trim().toLowerCase() || 'auto';

        const now = new Date();
        const todayWibYmd = formatWibYmd(now);
        const currentYear = toWibDate(now).getUTCFullYear();

        let gteDate = SYSTEM_START_DATE;
        if (startDateParam && /^\d{4}-\d{2}-\d{2}$/.test(startDateParam)) {
            const parsedStart = new Date(`${startDateParam}T00:00:00.000+07:00`);
            if (!isNaN(parsedStart.getTime())) {
                gteDate = new Date(Math.max(parsedStart.getTime(), SYSTEM_START_DATE.getTime()));
            }
        }

        let lteDate = new Date(`${currentYear}-12-31T23:59:59.999+07:00`);
        if (endDateParam && /^\d{4}-\d{2}-\d{2}$/.test(endDateParam)) {
            const parsedEnd = new Date(`${endDateParam}T23:59:59.999+07:00`);
            if (!isNaN(parsedEnd.getTime())) {
                lteDate = parsedEnd;
            }
        }

        const logs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: gteDate,
                    lte: lteDate,
                },
                OR: [
                    { kelurahanId: kelurahanId },
                    { armada: { kelurahanId: kelurahanId } },
                ],
            },
            select: {
                beratKg: true,
                recordedAt: true,
                timbangQrSync: {
                    select: { transdepo: true },
                },
                armada: {
                    select: { lokasiTransdepo: true },
                },
            },
            orderBy: { recordedAt: 'asc' },
        });

        const isSingleDay = Boolean(startDateParam && endDateParam && startDateParam === endDateParam);
        const hasCustomDates = Boolean(startDateParam || endDateParam);
        const granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' =
            rawGranularity === 'hourly' ||
            rawGranularity === 'daily' ||
            rawGranularity === 'weekly' ||
            rawGranularity === 'monthly'
                ? rawGranularity
                : isSingleDay
                  ? 'hourly'
                  : 'daily';

        const bucketMap = new Map<string, ReturnType<typeof createEmptyBucket>>();

        if (granularity === 'hourly') {
            const targetYmd = startDateParam || todayWibYmd;
            if (isSingleDay || !startDateParam || startDateParam === endDateParam) {
                const { fullLabel: dayTitle } = formatDailyLabel(targetYmd);
                for (let h = 0; h < 24; h++) {
                    const hh = String(h).padStart(2, '0');
                    const key = `${targetYmd} ${hh}:00`;
                    bucketMap.set(
                        key,
                        createEmptyBucket(key, `${hh}:00`, `${dayTitle} • Pukul ${hh}:00 - ${hh}:59 WIB`)
                    );
                }
            }
        } else if (granularity === 'daily') {
            const effectiveStartYmd =
                startDateParam && /^\d{4}-\d{2}-\d{2}$/.test(startDateParam)
                    ? startDateParam < SYSTEM_START_YMD
                        ? SYSTEM_START_YMD
                        : startDateParam
                    : SYSTEM_START_YMD;
            const effectiveEndYmd =
                endDateParam && /^\d{4}-\d{2}-\d{2}$/.test(endDateParam) ? endDateParam : todayWibYmd;

            if (effectiveStartYmd <= effectiveEndYmd) {
                const startMs = new Date(`${effectiveStartYmd}T00:00:00.000Z`).getTime();
                const endMs = new Date(`${effectiveEndYmd}T00:00:00.000Z`).getTime();
                const diffDays = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000));
                if (diffDays >= 0 && diffDays <= 180) {
                    for (let i = 0; i <= diffDays; i++) {
                        const cur = new Date(startMs + i * 24 * 60 * 60 * 1000);
                        const ymd = cur.toISOString().slice(0, 10);
                        const { label, fullLabel } = formatDailyLabel(ymd);
                        bucketMap.set(ymd, createEmptyBucket(ymd, label, fullLabel));
                    }
                }
            }
        } else if (granularity === 'monthly' && !hasCustomDates) {
            for (let mIdx = 0; mIdx < 12; mIdx++) {
                const mm = String(mIdx + 1).padStart(2, '0');
                const mName = MONTH_NAMES_SHORT[mIdx];
                const key = `${currentYear}-${mm}`;
                bucketMap.set(key, createEmptyBucket(key, mName, `Bulan ${mName} ${currentYear}`));
            }
        }

        let summaryTotalKg = 0;
        let summaryAirHitamKg = 0;
        let summaryHarapanJayaKg = 0;
        let summaryTotalTrips = 0;

        for (const log of logs) {
            const kg = Number(log.beratKg || 0);
            const td = (log.timbangQrSync?.transdepo || log.armada?.lokasiTransdepo || '').toUpperCase();
            const isAH = td.includes('AIR') || td.includes('PALAS');

            summaryTotalKg += kg;
            summaryTotalTrips += 1;
            if (isAH) summaryAirHitamKg += kg;
            else summaryHarapanJayaKg += kg;

            const wib = toWibDate(log.recordedAt);
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
                const dayOfWeek = wib.getUTCDay();
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
                const mm = String(m).padStart(2, '0');
                const mName = MONTH_NAMES_SHORT[m - 1] || mm;
                key = `${y}-${mm}`;
                label = hasCustomDates ? `${mName} ${y}` : mName;
                fullLabel = `Bulan ${mName} ${y}`;
            }

            let bucket = bucketMap.get(key);
            if (!bucket) {
                bucket = createEmptyBucket(key, label, fullLabel);
                bucketMap.set(key, bucket);
            }

            bucket.totalKg += kg;
            bucket.totalTon = Number((bucket.totalKg / 1000).toFixed(2));
            bucket.tripCount += 1;
            if (isAH) {
                bucket.airHitamKg += kg;
                bucket.airHitamTrips += 1;
            } else {
                bucket.harapanJayaKg += kg;
                bucket.harapanJayaTrips += 1;
            }
        }

        const timeline = Array.from(bucketMap.values()).sort((a, b) => a.key.localeCompare(b.key));

        return NextResponse.json({
            success: true,
            granularity,
            summary: {
                totalKg: summaryTotalKg,
                totalTon: Number((summaryTotalKg / 1000).toFixed(2)),
                airHitamKg: summaryAirHitamKg,
                harapanJayaKg: summaryHarapanJayaKg,
                totalTrips: summaryTotalTrips,
            },
            data: timeline,
            timeline,
        });
    } catch (error) {
        console.error('Error fetching LPS waste timeline stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch monthly stats' },
            { status: 500 }
        );
    }
}
