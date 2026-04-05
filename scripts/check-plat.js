const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

const platNumbers = [
    'BM 8618 QK',
    'BM 8575 AS',
    'BM 8780 FC',
    'BM 9592 TZ',
    'BM 9248 AJ',
    'BM 8202 TM'
];

async function main() {
    console.log('=== Checking Specific Plat Numbers ===');
    console.log('');

    // Read Excel
    const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Create map
    const excelMap = new Map();
    for (const row of excelData) {
        let plat = row['Nomor Polisi'];
        if (plat) {
            plat = String(plat).replace(/\s+/g, ' ').trim();
            excelMap.set(plat, row);
        }
    }

    // Check each plat
    for (const plat of platNumbers) {
        console.log('--- ' + plat + ' ---');

        const excelRow = excelMap.get(plat);
        if (excelRow) {
            const tglIzin = excelRow['tanggal Terbit Izin opersional'];
            console.log('Excel: "' + (tglIzin || '(KOSONG)') + '"');
        } else {
            console.log('Excel: TIDAK DITEMUKAN');
        }

        const dbRecord = await prisma.armada.findFirst({
            where: { platNomor: plat },
            select: { platNomor: true, tanggalTerbitIzin: true }
        });

        if (dbRecord) {
            console.log('DB: ' + (dbRecord.tanggalTerbitIzin ? dbRecord.tanggalTerbitIzin.toISOString() : 'NULL'));
        } else {
            console.log('DB: TIDAK DITEMUKAN');
        }
        console.log('');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
