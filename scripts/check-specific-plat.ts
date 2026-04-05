import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Plat nomor dari screenshot
const platNumbers = [
    'BM 8618 QK',
    'BM 8575 AS',
    'BM 8780 FC',
    'BM 9592 TZ',
    'BM 9248 AJ',
    'BM 8202 TM'
];

async function main() {
    console.log('=== Checking Specific Plat Numbers ===\n');

    // 1. Read Excel
    const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Create a map of Excel data by Plat Nomor
    const excelMap = new Map<string, any>();
    for (const row of excelData) {
        let plat = row['Nomor Polisi'];
        if (plat) {
            plat = String(plat).replace(/\s+/g, ' ').trim();
            excelMap.set(plat, row);
        }
    }

    // 2. Check each plat
    for (const plat of platNumbers) {
        console.log(`\n--- ${plat} ---`);

        // Check Excel
        const excelRow = excelMap.get(plat);
        if (excelRow) {
            const tglIzin = excelRow['tanggal Terbit Izin opersional'];
            console.log(`Excel "tanggal Terbit Izin opersional": "${tglIzin || '(KOSONG)'}"`);
        } else {
            console.log(`Excel: TIDAK DITEMUKAN`);
        }

        // Check DB
        const dbRecord = await prisma.armada.findFirst({
            where: { platNomor: plat },
            select: { platNomor: true, tanggalTerbitIzin: true, namaLps: true }
        });

        if (dbRecord) {
            console.log(`DB tanggalTerbitIzin: ${dbRecord.tanggalTerbitIzin ? dbRecord.tanggalTerbitIzin.toISOString() : 'NULL'}`);
        } else {
            console.log(`DB: TIDAK DITEMUKAN`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
