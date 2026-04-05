
import XLSX from 'xlsx';
import * as path from 'path';

async function main() {
    console.log('=== ANALISIS DUPLIKAT PLAT DI EXCEL (CROSS-LPS) ===\n');

    const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Map: normalized plate -> array of { row, plate, lps }
    const plateMap = new Map<string, any[]>();

    for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        let plat = row['Nomor Polisi'];
        let lps = row['Nama LPS'];

        if (plat) {
            const normalized = String(plat).replace(/\s+/g, '').toUpperCase();

            if (!plateMap.has(normalized)) {
                plateMap.set(normalized, []);
            }

            plateMap.get(normalized)?.push({
                rowNum: i + 2, // Excel row (0-indexed + header)
                plateOriginal: plat,
                lpsName: lps || 'TIDAK ADA NAMA LPS'
            });
        }
    }

    // Find duplicates
    const duplicates: any[] = [];
    plateMap.forEach((records, normalizedPlate) => {
        if (records.length > 1) {
            duplicates.push({ normalizedPlate, records });
        }
    });

    console.log(`Total Plat yang Duplikat di Excel: ${duplicates.length}\n`);

    if (duplicates.length > 0) {
        console.log('=== DETAIL DUPLIKAT ===\n');

        duplicates.forEach(dup => {
            // Check if plates belong to different LPS
            const uniqueLPS = new Set(dup.records.map((r: any) => r.lpsName));
            const isDifferentLPS = uniqueLPS.size > 1;

            console.log(`Plat: ${dup.normalizedPlate} (Muncul ${dup.records.length}x)`);
            if (isDifferentLPS) {
                console.log(`⚠️  PERINGATAN: Plat ini terdaftar di ${uniqueLPS.size} LPS BERBEDA!`);
            } else {
                console.log(`✓ Semua di LPS yang sama: ${dup.records[0].lpsName}`);
            }

            dup.records.forEach((rec: any, idx: number) => {
                console.log(`  [Baris ${rec.rowNum}] "${rec.plateOriginal}" → LPS: ${rec.lpsName}`);
            });
            console.log('');
        });

        // Summary of cross-LPS issues
        const crossLPSIssues = duplicates.filter(dup => {
            const uniqueLPS = new Set(dup.records.map((r: any) => r.lpsName));
            return uniqueLPS.size > 1;
        });

        console.log(`\n=== RINGKASAN ===`);
        console.log(`Total Duplikat: ${duplicates.length}`);
        console.log(`Duplikat di LPS Berbeda (MASALAH): ${crossLPSIssues.length}`);
        console.log(`Duplikat di LPS Sama (Wajar): ${duplicates.length - crossLPSIssues.length}`);
    }
}

main();
