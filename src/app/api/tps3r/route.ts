import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function subDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d;
}

function calculateHours(start: Date, end: Date): number {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return 0;
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

let tableEnsured = false;
async function ensureTps3rTable() {
    if (tableEnsured) return;
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tps3r_reports (
            id TEXT PRIMARY KEY,
            tanggal TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            nama_operator TEXT NOT NULL,
            jumlah_pekerja INTEGER NOT NULL,
            jenis_sampah TEXT NOT NULL,
            berat_sampah_masuk DOUBLE PRECISION NOT NULL,
            berat_ampas_setelah_pilahan DOUBLE PRECISION NOT NULL,
            berat_plastik_setelah_pilahan DOUBLE PRECISION NOT NULL,
            berat_sampah_dibakar DOUBLE PRECISION NOT NULL,
            jenis_bbm TEXT NOT NULL,
            jumlah_kayu DOUBLE PRECISION,
            jumlah_ban DOUBLE PRECISION,
            jumlah_oli DOUBLE PRECISION,
            waktu_pemilahan_mulai TIMESTAMP(3) NOT NULL,
            waktu_pemilahan_selesai TIMESTAMP(3) NOT NULL,
            waktu_pembakaran_mulai TIMESTAMP(3) NOT NULL,
            waktu_pembakaran_selesai TIMESTAMP(3) NOT NULL,
            status_operasi TEXT NOT NULL,
            catatan_kerusakan TEXT,
            tindakan_perbaikan TEXT,
            tindakan_perawatan TEXT,
            foto_incinerator TEXT,
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS tps3r_reports_tanggal_idx ON tps3r_reports(tanggal);
    `);
    tableEnsured = true;
}

export async function GET() {
    try {
        await ensureTps3rTable();
        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);
        const weekStart = startOfDay(subDays(today, 6));
        const monthStart = startOfDay(subDays(today, 30));

        const allReports = await prisma.tps3rReport.findMany({
            orderBy: [
                { tanggal: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        // 1. Today's reports & weekly stats
        const todayReports = allReports.filter((r) => {
            const t = new Date(r.tanggal);
            return t >= todayStart && t <= todayEnd;
        });

        const weeklyReports = allReports.filter((r) => {
            const t = new Date(r.tanggal);
            return t >= subDays(today, 7) && t <= todayEnd;
        });

        const todaySampahMasuk = todayReports.reduce((sum, r) => sum + r.beratSampahMasuk, 0);
        const todaySampahDibakar = todayReports.reduce((sum, r) => sum + r.beratSampahDibakar, 0);
        const totalWorkers = todayReports.reduce((sum, r) => sum + r.jumlahPekerja, 0);
        const latestStatus = todayReports[0]?.statusOperasi || allReports[0]?.statusOperasi || 'normal';

        const weeklySampah = weeklyReports.reduce((sum, r) => sum + r.beratSampahMasuk, 0);
        const weeklyAvgSampah = weeklyReports.length > 0 ? weeklySampah / 7 : 0;

        const stats = {
            todaySampahMasuk: Math.round(todaySampahMasuk * 10) / 10,
            todaySampahDibakar: Math.round(todaySampahDibakar * 10) / 10,
            totalReportsToday: todayReports.length,
            latestStatus,
            totalWorkers,
            weeklyAvgSampah: Math.round(weeklyAvgSampah * 10) / 10,
        };

        // 2. Operational Hours & Fuel Consumption for last 7 days
        const operationalHours = [];
        const fuelData = [];

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);

            const dayReports = allReports.filter((r) => {
                const t = new Date(r.tanggal);
                return t >= dayStart && t <= dayEnd;
            });

            let pemilahanHours = 0;
            let pembakaranHours = 0;
            let kayu = 0;
            let oli = 0;
            let ban = 0;

            for (const r of dayReports) {
                pemilahanHours += calculateHours(r.waktuPemilahanMulai, r.waktuPemilahanSelesai);
                pembakaranHours += calculateHours(r.waktuPembakaranMulai, r.waktuPembakaranSelesai);
                kayu += r.jumlahKayu || 0;
                oli += r.jumlahOli || 0;
                ban += r.jumlahBan || 0;
            }

            const dayLabel = date.toLocaleDateString('id-ID', { weekday: 'short' });

            operationalHours.push({
                date: dayLabel,
                pemilahanHours: Math.round(pemilahanHours * 10) / 10,
                pembakaranHours: Math.round(pembakaranHours * 10) / 10,
            });

            fuelData.push({
                date: dayLabel,
                kayu: Math.round(kayu * 10) / 10,
                oli: Math.round(oli * 10) / 10,
                ban: Math.round(ban * 10) / 10,
            });
        }

        // 3. Maintenance History (reports with kendala / perawatan / catatanKerusakan)
        const maintenanceData = allReports
            .filter(
                (r) =>
                    r.statusOperasi === 'kendala' ||
                    r.statusOperasi === 'perawatan' ||
                    (r.catatanKerusakan && r.catatanKerusakan.trim() !== '')
            )
            .slice(0, 10)
            .map((r) => ({
                id: r.id,
                tanggal: r.tanggal,
                statusOperasi: r.statusOperasi,
                catatanKerusakan: r.catatanKerusakan,
                tindakanPerbaikan: r.tindakanPerbaikan,
                tindakanPerawatan: r.tindakanPerawatan,
                namaOperator: r.namaOperator,
            }));

        // 4. Readiness Stats (last 30 days)
        const monthReports = allReports.filter((r) => {
            const t = new Date(r.tanggal);
            return t >= monthStart && t <= todayEnd;
        });

        const normalDays = monthReports.filter((r) => r.statusOperasi === 'normal').length;
        const kendalaDays = monthReports.filter((r) => r.statusOperasi === 'kendala').length;
        const perawatanDays = monthReports.filter((r) => r.statusOperasi === 'perawatan').length;
        const totalDays = monthReports.length;
        const readinessPercentage = totalDays > 0 ? Math.round((normalDays / totalDays) * 100) : 100;

        const readinessStats = {
            normalDays,
            kendalaDays,
            perawatanDays,
            totalDays,
            readinessPercentage,
        };

        // 5. Recent Workers (distinct operators in last 7 days, fallback to latest overall)
        const seenOperators = new Set<string>();
        const recentWorkers: { name: string; role: string; date: Date }[] = [];
        const sourceForWorkers = weeklyReports.length > 0 ? weeklyReports : allReports;

        for (const r of sourceForWorkers) {
            const opName = r.namaOperator.trim();
            if (opName && !seenOperators.has(opName.toLowerCase())) {
                seenOperators.add(opName.toLowerCase());
                recentWorkers.push({
                    name: r.namaOperator,
                    role: 'Operator TPS3R',
                    date: r.tanggal,
                });
                if (recentWorkers.length >= 5) break;
            }
        }

        return NextResponse.json({
            success: true,
            stats,
            operationalHours,
            fuelData,
            maintenanceData,
            readinessStats,
            recentWorkers,
            reports: allReports,
        });
    } catch (error) {
        console.error('Error fetching TPS3R data:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal memuat data TPS3R' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureTps3rTable();
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Silakan login terlebih dahulu' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const tanggalDate = body.tanggal ? new Date(body.tanggal) : new Date();
        const baseDate = tanggalDate.toISOString().split('T')[0];

        const createDateTime = (timeString: string, fallbackTime: string) => {
            const cleanTime = timeString && /^\d{2}:\d{2}/.test(timeString) ? timeString.slice(0, 5) : fallbackTime;
            return new Date(`${baseDate}T${cleanTime}:00`);
        };

        if (!body.namaOperator || String(body.namaOperator).trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Nama operator minimal 2 karakter' },
                { status: 400 }
            );
        }

        const report = await prisma.tps3rReport.create({
            data: {
                tanggal: tanggalDate,
                namaOperator: String(body.namaOperator).trim(),
                jumlahPekerja: Math.max(1, Number(body.jumlahPekerja) || 1),
                jenisSampah: String(body.jenisSampah || 'organik'),
                beratSampahMasuk: Math.max(0, Number(body.beratSampahMasuk) || 0),
                beratAmpasSetelahPilahan: Math.max(0, Number(body.beratAmpasSetelahPilahan) || 0),
                beratPlastikSetelahPilahan: Math.max(0, Number(body.beratPlastikSetelahPilahan) || 0),
                beratSampahDibakar: Math.max(0, Number(body.beratSampahDibakar) || 0),

                jenisBBM: String(body.jenisBBM || 'kayu'),
                jumlahKayu: body.jumlahKayu !== undefined && body.jumlahKayu !== '' ? Number(body.jumlahKayu) : 0,
                jumlahBan: body.jumlahBan !== undefined && body.jumlahBan !== '' ? Number(body.jumlahBan) : 0,
                jumlahOli: body.jumlahOli !== undefined && body.jumlahOli !== '' ? Number(body.jumlahOli) : 0,

                waktuPemilahanMulai: createDateTime(body.waktuPemilahanMulai, '08:00'),
                waktuPemilahanSelesai: createDateTime(body.waktuPemilahanSelesai, '12:00'),
                waktuPembakaranMulai: createDateTime(body.waktuPembakaranMulai, '09:00'),
                waktuPembakaranSelesai: createDateTime(body.waktuPembakaranSelesai, '14:00'),

                statusOperasi: String(body.statusOperasi || 'normal'),
                catatanKerusakan: body.catatanKerusakan ? String(body.catatanKerusakan) : null,
                tindakanPerbaikan: body.tindakanPerbaikan ? String(body.tindakanPerbaikan) : null,
                tindakanPerawatan: body.tindakanPerawatan ? String(body.tindakanPerawatan) : null,

                fotoIncinerator: body.fotoIncinerator ? String(body.fotoIncinerator) : null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Laporan harian TPS3R berhasil disimpan',
            data: report,
        });
    } catch (error) {
        console.error('Failed to submit TPS3R report:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal menyimpan laporan TPS3R' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID laporan diperlukan' },
                { status: 400 }
            );
        }

        await prisma.tps3rReport.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Laporan berhasil dihapus',
        });
    } catch (error) {
        console.error('Failed to delete TPS3R report:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal menghapus laporan' },
            { status: 500 }
        );
    }
}
