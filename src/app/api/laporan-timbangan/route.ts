import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transdepoParam = (searchParams.get('transdepo') || 'air-hitam').toLowerCase();
        const kelurahanFilter = (searchParams.get('kelurahan') || searchParams.get('lps') || '').trim();
        const range = searchParams.get('range') || 'all';
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');
        const search = searchParams.get('search')?.trim() || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limitParam = searchParams.get('limit') || '25';
        const isExportAll = limitParam === 'all' || limitParam === '-1';
        const limit = isExportAll ? 5000 : Math.max(1, parseInt(limitParam, 10));

        const isAirHitam = transdepoParam.includes('air');
        const transdepoTargetName = isAirHitam ? 'Transdepo Air Hitam' : 'Transdepo Harapan Jaya';

        // Filter Transdepo
        const transdepoWhere: Prisma.WasteLogWhereInput = isAirHitam
            ? {
                OR: [
                    { timbangQrSync: { transdepo: { contains: 'AIR', mode: 'insensitive' } } },
                    {
                        AND: [
                            { timbangQrSync: null },
                            { armada: { lokasiTransdepo: { contains: 'AIR', mode: 'insensitive' } } }
                        ]
                    }
                ]
            }
            : {
                OR: [
                    { timbangQrSync: { transdepo: { contains: 'HARAPAN', mode: 'insensitive' } } },
                    {
                        AND: [
                            { timbangQrSync: null },
                            { armada: { lokasiTransdepo: { contains: 'HARAPAN', mode: 'insensitive' } } }
                        ]
                    }
                ]
            };

        // Hitung rentang waktu dalam zona WIB (UTC+7)
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const nowWib = new Date(now.getTime() + wibOffset);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth();
        const d = nowWib.getUTCDate();

        let dateFilter: { gte?: Date; lte?: Date; lt?: Date } | undefined = undefined;

        if (range === 'today') {
            const startOfDayWib = new Date(Date.UTC(y, m, d, -7, 0, 0, 0));
            const endOfDayWib = new Date(Date.UTC(y, m, d + 1, -7, 0, 0, 0));
            dateFilter = { gte: startOfDayWib, lt: endOfDayWib };
        } else if (range === 'week') {
            const sevenDaysAgo = new Date(Date.UTC(y, m, d - 6, -7, 0, 0, 0));
            const endOfDayWib = new Date(Date.UTC(y, m, d + 1, -7, 0, 0, 0));
            dateFilter = { gte: sevenDaysAgo, lt: endOfDayWib };
        } else if (range === 'month') {
            const startOfMonthWib = new Date(Date.UTC(y, m, 1, -7, 0, 0, 0));
            const endOfMonthWib = new Date(Date.UTC(y, m + 1, 1, -7, 0, 0, 0));
            dateFilter = { gte: startOfMonthWib, lt: endOfMonthWib };
        } else if (range === 'last-month') {
            const startOfLastMonthWib = new Date(Date.UTC(y, m - 1, 1, -7, 0, 0, 0));
            const endOfLastMonthWib = new Date(Date.UTC(y, m, 1, -7, 0, 0, 0));
            dateFilter = { gte: startOfLastMonthWib, lt: endOfLastMonthWib };
        } else if (range === 'custom' && customStart) {
            const startParts = customStart.split('-').map(Number);
            const startCustomWib = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2], -7, 0, 0, 0));
            
            let endCustomWib = new Date(Date.UTC(y, m, d + 1, -7, 0, 0, 0));
            if (customEnd) {
                const endParts = customEnd.split('-').map(Number);
                endCustomWib = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2] + 1, -7, 0, 0, 0));
            }
            dateFilter = { gte: startCustomWib, lt: endCustomWib };
        }

        // Build combined where query
        const conditions: Prisma.WasteLogWhereInput[] = [transdepoWhere];

        if (dateFilter) {
            conditions.push({ recordedAt: dateFilter });
        }

        if (kelurahanFilter && kelurahanFilter !== 'ALL') {
            conditions.push({
                OR: [
                    { kelurahan: { nama: { equals: kelurahanFilter, mode: 'insensitive' } } },
                    { armada: { kelurahan: { nama: { equals: kelurahanFilter, mode: 'insensitive' } } } },
                    { timbangQrSync: { lpsName: { contains: kelurahanFilter, mode: 'insensitive' } } },
                    { armada: { namaLps: { contains: kelurahanFilter, mode: 'insensitive' } } },
                ]
            });
        }

        if (search) {
            conditions.push({
                OR: [
                    { timbangQrSync: { ticketNumber: { contains: search, mode: 'insensitive' } } },
                    { timbangQrSync: { plateNumber: { contains: search, mode: 'insensitive' } } },
                    { timbangQrSync: { lpsName: { contains: search, mode: 'insensitive' } } },
                    { armada: { platNomor: { contains: search, mode: 'insensitive' } } },
                    { armada: { namaLps: { contains: search, mode: 'insensitive' } } },
                    { armada: { namaSupir: { contains: search, mode: 'insensitive' } } },
                    { kelurahan: { nama: { contains: search, mode: 'insensitive' } } },
                ]
            });
        }

        const finalWhere: Prisma.WasteLogWhereInput = conditions.length === 1
            ? conditions[0]
            : { AND: conditions };

        // 1. Fetch Distinct Kelurahan for dropdown filter
        const transdepoArmadas = await prisma.armada.findMany({
            where: {
                lokasiTransdepo: {
                    contains: isAirHitam ? 'AIR' : 'HARAPAN',
                    mode: 'insensitive'
                },
                kelurahanId: { not: null }
            },
            select: {
                kelurahan: { select: { nama: true } }
            }
        });

        const transdepoLogs = await prisma.wasteLog.findMany({
            where: transdepoWhere,
            select: {
                kelurahan: { select: { nama: true } },
                armada: { select: { kelurahan: { select: { nama: true } } } }
            }
        });

        const kelurahanOptionsSet = new Set<string>();
        transdepoArmadas.forEach(a => {
            if (a.kelurahan?.nama?.trim()) kelurahanOptionsSet.add(a.kelurahan.nama.trim());
        });
        transdepoLogs.forEach(l => {
            if (l.kelurahan?.nama?.trim()) kelurahanOptionsSet.add(l.kelurahan.nama.trim());
            if (l.armada?.kelurahan?.nama?.trim()) kelurahanOptionsSet.add(l.armada.kelurahan.nama.trim());
        });

        if (kelurahanOptionsSet.size === 0) {
            const allKels = await prisma.kelurahan.findMany({ select: { nama: true } });
            allKels.forEach(k => { if (k.nama?.trim()) kelurahanOptionsSet.add(k.nama.trim()); });
        }

        const kelurahanOptions = Array.from(kelurahanOptionsSet).sort((a, b) => a.localeCompare(b, 'id'));

        // 2. Aggregate KPI summary for the current filtered query
        const allFilteredLogs = await prisma.wasteLog.findMany({
            where: finalWhere,
            select: {
                beratKg: true,
                armadaId: true,
                kelurahan: { select: { nama: true } },
                armada: {
                    select: {
                        namaLps: true,
                        kelurahan: { select: { nama: true } }
                    }
                },
                timbangQrSync: {
                    select: {
                        grossKg: true,
                        tareKg: true,
                        nettoKg: true,
                        rafaksiKg: true,
                        lpsName: true
                    }
                }
            }
        });

        const totalTrips = allFilteredLogs.length;
        const totalNettoKg = allFilteredLogs.reduce((sum, item) => {
            const netto = item.timbangQrSync?.nettoKg ? Number(item.timbangQrSync.nettoKg) : Number(item.beratKg || 0);
            return sum + netto;
        }, 0);
        const totalGrossKg = allFilteredLogs.reduce((sum, item) => {
            return sum + (item.timbangQrSync?.grossKg ? Number(item.timbangQrSync.grossKg) : 0);
        }, 0);
        const totalTareKg = allFilteredLogs.reduce((sum, item) => {
            return sum + (item.timbangQrSync?.tareKg ? Number(item.timbangQrSync.tareKg) : 0);
        }, 0);
        const totalRafaksiKg = allFilteredLogs.reduce((sum, item) => {
            return sum + (item.timbangQrSync?.rafaksiKg ? Number(item.timbangQrSync.rafaksiKg) : 0);
        }, 0);

        const uniqueArmadaCount = new Set(allFilteredLogs.map(l => l.armadaId).filter(Boolean)).size;
        const activeLpsSet = new Set<string>();
        const activeKelurahanSet = new Set<string>();
        allFilteredLogs.forEach(l => {
            const name = l.armada?.namaLps || l.timbangQrSync?.lpsName;
            if (name) {
                const normLps = name.toUpperCase().replace(/^LPS[\s\-_]+/i, '').replace(/[^A-Z0-9]/g, '');
                if (normLps) activeLpsSet.add(normLps);
            }
            const kName = l.armada?.kelurahan?.nama || l.kelurahan?.nama;
            if (kName) activeKelurahanSet.add(kName);
        });
        const activeLpsCount = activeLpsSet.size;
        const activeKelurahanCount = activeKelurahanSet.size;
        const avgKgPerTrip = totalTrips > 0 ? Math.round(totalNettoKg / totalTrips) : 0;

        // 3. Fetch Paginated Records
        const [logs, totalCount] = await Promise.all([
            prisma.wasteLog.findMany({
                where: finalWhere,
                include: {
                    timbangQrSync: true,
                    armada: {
                        include: {
                            kelurahan: {
                                include: { kecamatan: true }
                            }
                        }
                    },
                    kelurahan: {
                        include: { kecamatan: true }
                    },
                    user: {
                        select: { name: true, role: true }
                    }
                },
                orderBy: { recordedAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.wasteLog.count({ where: finalWhere })
        ]);

        // Transform logs for frontend
        const items = logs.map(log => {
            const sync = log.timbangQrSync;
            const armada = log.armada;
            const kel = armada?.kelurahan || log.kelurahan;
            
            let payloadObj: any = {};
            if (sync?.payload) {
                try {
                    payloadObj = JSON.parse(sync.payload);
                } catch {
                    payloadObj = {};
                }
            }

            const ticketNumber = sync?.ticketNumber || log.metadata ? JSON.parse(log.metadata || '{}').ticketNumber || '-' : '-';
            const plateNumber = sync?.plateNumber || armada?.platNomor || '-';
            const lpsName = armada?.namaLps || sync?.lpsName || kel?.nama || 'LPS Belum Terdata';
            const driverName = payloadObj.driverName || armada?.namaSupir || '-';
            const vehicleType = payloadObj.vehicleType || armada?.jenisArmada || 'PICKUP';
            const wasteType = payloadObj.wasteType || 'SAMPAH RUMAH TANGGA';
            
            const grossKg = sync?.grossKg ? Number(sync.grossKg) : null;
            const tareKg = sync?.tareKg ? Number(sync.tareKg) : null;
            const rafaksiKg = sync?.rafaksiKg ? Number(sync.rafaksiKg) : 0;
            const nettoKg = sync?.nettoKg ? Number(sync.nettoKg) : Number(log.beratKg);

            const weighedAt = sync?.weighedAt || log.recordedAt;

            return {
                id: log.id,
                syncId: sync?.id || null,
                ticketNumber,
                plateNumber,
                lpsName,
                driverName,
                vehicleType,
                wasteType,
                kelurahan: kel?.nama || '-',
                kecamatan: kel?.kecamatan?.nama || '-',
                transdepo: sync?.transdepo || (isAirHitam ? 'AIR_HITAM' : 'HARAPAN_JAYA'),
                grossKg,
                tareKg,
                rafaksiKg,
                nettoKg,
                weighedAt: weighedAt.toISOString(),
                source: payloadObj.indicatorRaw?.includes('OCR_LED') ? 'Kamera OCR LED' : 'Aplikasi TimbangQR',
                operatorName: log.user?.name || 'Operator Timbang'
            };
        });

        return NextResponse.json({
            success: true,
            transdepo: transdepoParam,
            transdepoTitle: transdepoTargetName,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            summary: {
                totalNettoKg,
                totalNettoTon: Number((totalNettoKg / 1000).toFixed(2)),
                totalGrossKg,
                totalTareKg,
                totalRafaksiKg,
                totalTrips,
                avgKgPerTrip,
                uniqueArmadaCount,
                activeLpsCount,
                activeKelurahanCount
            },
            kelurahanOptions,
            lpsOptions: kelurahanOptions, // backwards compatibility
            items
        });

    } catch (error: any) {
        console.error('[API /api/laporan-timbangan Error]:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Terjadi kesalahan server'
        }, { status: 500 });
    }
}
