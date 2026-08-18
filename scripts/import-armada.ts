import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

function excelDateToJSDate(serial: number): Date | null {
    if (!serial || isNaN(serial)) return null;
    // Excel base date is 1900-01-01, but there's a leap year bug in Excel (1900 is treated as leap year)
    // JS base date is 1970-01-01
    // 25569 is the number of days between 1900-01-01 and 1970-01-01
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
}

function normalizeLokasi(lokasi: string): string | null {
    if (!lokasi) return null;
    const up = lokasi.toUpperCase();
    if (up.includes('HAM') || up.includes('AIR')) return 'AIRHITAM'; // AIR HITAM -> AIRHITAM
    if (up.includes('HARAPAN')) return 'HARAPANJAYA'; // HARAPAN JAYA -> HARAPANJAYA
    return null;
}

function normalizeJenis(jenis: string): string | null {
    if (!jenis) return null;
    const up = jenis.toUpperCase();
    if (up.includes('PICK')) return 'PICKUP';
    if (up.includes('DUMP') || up.includes('TRUCK')) return 'DUMPTRUCK';
    if (up.includes('BENTOR') || up.includes('MOTOR')) return 'BENTOR';
    return up;
}

async function main() {
    console.log('Starting import...');

    // Read Excel
    const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} rows to process.`);

    // Cache Kelurahan
    const allKelurahan = await prisma.kelurahan.findMany({
        include: { kecamatan: true }
    });
    console.log(`Loaded ${allKelurahan.length} kelurahan from DB.`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
        try {
            // Map columns
            const platNomor = row['Nomor Polisi']?.toString().replace(/\s+/g, ' ').trim();
            if (!platNomor) {
                console.log('Skipping row without Plat Nomor', row);
                continue;
            }

            const namaLps = (row['nama lps'] || row['Nama LPS 2'] || 'Unknown').trim();
            const namaKetua = row['Nama Ketua LPS']?.toString().trim() || null;
            const alamat = row['Alamat LPS']?.toString().trim() || null;
            const wilayahKerja = row['Wilayah Kerja']?.toString().trim() || null;
            const noIzin = row['Nomor izin']?.toString().trim() || null;
            const noSk = row['Nomor SK LPS']?.toString().trim() || null;

            // Dates
            const tglSk = row['Tanggal Sk LPS'] ? excelDateToJSDate(Number(row['Tanggal Sk LPS'])) : null;
            const tglIzin = row['tanggal Terbit Izin opersional'] ?
                (typeof row['tanggal Terbit Izin opersional'] === 'number' ? excelDateToJSDate(row['tanggal Terbit Izin opersional']) : new Date(row['tanggal Terbit Izin opersional']))
                : null;

            // Handle string dates explicitly if they are not numbers
            const parsedTglIzin = (tglIzin && !isNaN(tglIzin.getTime())) ? tglIzin : null;
            const parsedTglSk = (tglSk && !isNaN(tglSk.getTime())) ? tglSk : null;

            const lokasiRaw = row['Lokasi TPS Wilayah']?.toString();
            const lokasi = normalizeLokasi(lokasiRaw);

            const jenisRaw = row['Jenis Armada']?.toString();
            const jenis = normalizeJenis(jenisRaw);

            const kelurahanRaw = row['Kelurahan LPS']?.toString().trim();
            let kelurahanId = null;

            if (kelurahanRaw) {
                const match = allKelurahan.find(k => k.nama.toLowerCase() === kelurahanRaw.toLowerCase());
                if (match) {
                    kelurahanId = match.id;
                } else {
                    // Try partial match or manual mapping if strictly needed
                    // console.warn(`Kelurahan not found: ${kelurahanRaw}`);
                }
            }

            const namaSupirRaw = row['Nama Supir'] || row['supir'] || row['Nama Driver'] || row['Driver'] || null;
            const namaSupir = namaSupirRaw ? namaSupirRaw.toString().trim() : null;

            // Upsert
            const result = await prisma.armada.upsert({
                where: { platNomor: platNomor },
                update: {
                    namaLps: namaLps,
                    namaKetuaLps: namaKetua,
                    alamatLps: alamat,
                    wilayahKerja: wilayahKerja,
                    noIzinOperasi: noIzin,
                    nomorSkLps: noSk,
                    tanggalSkLps: parsedTglSk,
                    tanggalTerbitIzin: parsedTglIzin,
                    lokasiTransdepo: lokasi,
                    jenisArmada: jenis,
                    kelurahanId: kelurahanId,
                    namaSupir: namaSupir,
                    updatedAt: new Date()
                },
                create: {
                    platNomor: platNomor,
                    namaLps: namaLps,
                    namaKetuaLps: namaKetua,
                    alamatLps: alamat,
                    wilayahKerja: wilayahKerja,
                    noIzinOperasi: noIzin,
                    nomorSkLps: noSk,
                    tanggalSkLps: parsedTglSk,
                    tanggalTerbitIzin: parsedTglIzin,
                    lokasiTransdepo: lokasi,
                    jenisArmada: jenis,
                    kelurahanId: kelurahanId,
                    namaSupir: namaSupir,
                    qrCode: `ARMADA-${platNomor.replace(/\s/g, '')}`,
                    isActive: true,
                }
            });

            // We can't easily tell IF it was created or updated from the return value of upsert in Prisma (it just returns the object).
            // But we can check if createdAt is close to now.
            // A better way for debugging is to check existence first or just trust the count. 
            // Let's rely on checking existence for debugging purpose.

            // Re-fetch to see created time (optional) or just logging.
            // Actually, let's just count total processed.
            // If the user says 221 rows, and we have 214 DB records, maybe 7 records share the same Plat Nomor?

            successCount++;
            // process.stdout.write('.');
        } catch (err) {
            console.error(`Error processing row with Plat ${row['Nomor Polisi']}:`, err);
            errorCount++;
        }
    }

    console.log('\nImport finished.');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
