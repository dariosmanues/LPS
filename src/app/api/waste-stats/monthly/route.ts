import { NextRequest, NextResponse } from 'next/server';
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

export interface WasteTimelineBucket {
    key: string;
    month: string;
    label: string;
    fullLabel: string;
    totalKg: number;
    totalTon: number;
    airHitamKg: number;
    harapanJayaKg: number;
    tripCount: number;
    airHitamTrips: number;
    harapanJayaTrips: number;
}

function createEmptyBucket(key: string, label: string, fullLabel: string): WasteTimelineBucket {
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

function parseLogMeta(metadata?: string | null): Record<string, any> {
    if (!metadata) return {};
    try {
        return JSON.parse(metadata);
    } catch {
        return {};
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate')?.trim() || '';
        const endDateParam = searchParams.get('endDate')?.trim() || '';
        const rawGranularity = searchParams.get('granularity')?.trim().toLowerCase() || 'auto';
        const transdepoParam = searchParams.get('transdepo')?.trim().toUpperCase() || 'ALL';

        const now = new Date();
        const todayWibYmd = formatWibYmd(now);
        const currentYear = toWibDate(now).getUTCFullYear();

        // Hitung batas waktu efektif (selalu >= 12 Oktober 2026)
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

        // Ambil seluruh log pada rentang tanggal
        const logs = await prisma.wasteLog.findMany({
            where: {
                recordedAt: {
                    gte: gteDate,
                    lte: lteDate,
                },
            },
            select: {
                beratKg: true,
                recordedAt: true,
                metadata: true,
                user: {
                    select: { transdepo: true },
                },
                armada: {
                    select: { lokasiTransdepo: true },
                },
                timbangQrSync: {
                    select: { transdepo: true },
                },
            },
            orderBy: { recordedAt: 'asc' },
        });

        const detectAirHitam = (log: (typeof logs)[number]): boolean => {
            const syncTd = (log.timbangQrSync?.transdepo || '').toUpperCase();
            if (syncTd === 'AIR_HITAM' || syncTd === 'AIRHITAM') return true;
            if (syncTd === 'HARAPAN_JAYA' || syncTd === 'HARAPANJAYA') return false;

            const userTd = (log.user?.transdepo || '').toUpperCase();
            if (userTd === 'AIR_HITAM' || userTd === 'AIRHITAM') return true;
            if (userTd === 'HARAPAN_JAYA' || userTd === 'HARAPANJAYA') return false;

            const meta = parseLogMeta(log.metadata);
            const armadaTd = (
                log.armada?.lokasiTransdepo ||
                meta.deletedArmada?.lokasiTransdepo ||
                meta.lokasiTransdepo ||
                ''
            ).toUpperCase();
            if (armadaTd.includes('AIR') || armadaTd.includes('PALAS')) return true;
            return false;
        };

        // Tentukan granularity efektif
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
                  : hasCustomDates
                    ? 'daily'
                    : 'daily';

        const bucketMap = new Map<string, WasteTimelineBucket>();

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
        let summaryAirHitamTrips = 0;
        let summaryHarapanJayaTrips = 0;

        for (const log of logs) {
            const kg = Number(log.beratKg || 0);
            const isAH = detectAirHitam(log);

            if (transdepoParam === 'AIR_HITAM' && !isAH) continue;
            if (transdepoParam === 'HARAPAN_JAYA' && isAH) continue;

            summaryTotalKg += kg;
            summaryTotalTrips += 1;
            if (isAH) {
                summaryAirHitamKg += kg;
                summaryAirHitamTrips += 1;
            } else {
                summaryHarapanJayaKg += kg;
                summaryHarapanJayaTrips += 1;
            }

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
                airHitamTrips: summaryAirHitamTrips,
                harapanJayaTrips: summaryHarapanJayaTrips,
            },
            data: timeline,
            timeline,
        });
    } catch (error) {
        console.error('Error fetching waste timeline stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch waste timeline stats' },
            { status: 500 }
        );
    }
}
