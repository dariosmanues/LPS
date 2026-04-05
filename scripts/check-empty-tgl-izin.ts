import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Checking Empty tanggalTerbitIzin ===\n');

    // 1. Read Excel
    const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Create a map of Excel data by Plat Nomor
    const excelMap = new Map<string, { tglIzin: any, row: any }>();
    for (const row of excelData) {
        let plat = row['Nomor Polisi'];
        if (plat) {
            plat = String(plat).replace(/\s+/g, ' ').trim();
            const tglIzin = row['tanggal Terbit Izin opersional'];
            excelMap.set(plat, { tglIzin, row });
        }
    }

    // 2. Get armada with NULL tanggalTerbitIzin from DB
    const armadaWithNullDate = await prisma.armada.findMany({
        where: { tanggalTerbitIzin: null },
        select: { platNomor: true, namaLps: true }
    });

    console.log(`Records in DB with NULL tanggalTerbitIzin: ${armadaWithNullDate.length}\n`);
    console.log('--- Comparing with Excel data ---\n');

    for (const armada of armadaWithNullDate) {
        const plat = armada.platNomor?.replace(/\s+/g, ' ').trim();
        if (!plat) continue;

        const excelRecord = excelMap.get(plat);
        if (excelRecord) {
            const excelTglIzin = excelRecord.tglIzin;
            const isEmpty = !excelTglIzin || String(excelTglIzin).trim() === '';
            console.log(`Plat: ${plat}`);
            console.log(`  DB: tanggalTerbitIzin = NULL`);
            console.log(`  Excel: "tanggal Terbit Izin opersional" = "${excelTglIzin}" (${isEmpty ? 'KOSONG' : 'ADA ISINYA!'})`);
            if (!isEmpty) {
                console.log(`  >>> MISMATCH: Excel punya data tapi DB kosong!`);
            }
            console.log('');
        } else {
            console.log(`Plat: ${plat} - Tidak ditemukan di Excel`);
        }
    }

    // Also check: Excel rows with empty tanggal Terbit Izin opersional
    console.log('\n=== Excel rows with empty "tanggal Terbit Izin opersional" ===\n');
    let emptyCount = 0;
    for (const [plat, data] of excelMap.entries()) {
        const tglIzin = data.tglIzin;
        if (!tglIzin || String(tglIzin).trim() === '') {
            emptyCount++;
            console.log(`Plat: ${plat} - Excel tanggal Terbit Izin opersional: KOSONG`);
        }
    }
    console.log(`\nTotal Excel rows with empty tanggal: ${emptyCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
