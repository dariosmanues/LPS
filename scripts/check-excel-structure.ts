
import XLSX from 'xlsx';
import * as path from 'path';

async function main() {
    console.log('=== CEK STRUKTUR KOLOM EXCEL ===\n');

    const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    console.log('Nama Kolom yang Tersedia:');
    if (excelData.length > 0) {
        const columns = Object.keys(excelData[0]);
        columns.forEach((col, idx) => {
            console.log(`${idx + 1}. "${col}"`);
        });
    }

    console.log('\n=== SAMPLE 5 BARIS PERTAMA ===\n');
    for (let i = 0; i < Math.min(5, excelData.length); i++) {
        console.log(`Baris ${i + 2}:`);
        console.log(JSON.stringify(excelData[i], null, 2));
        console.log('');
    }

    // Check the specific duplicate rows
    const targetRows = [13, 14, 33, 34, 35]; // Excel row numbers (1-indexed with header)
    console.log('=== DATA BARIS DUPLIKAT ===\n');

    targetRows.forEach(rowNum => {
        const idx = rowNum - 2; // Convert to 0-indexed array
        if (idx >= 0 && idx < excelData.length) {
            const row = excelData[idx];
            console.log(`Baris ${rowNum} (Plat: ${row['Nomor Polisi']}):`);

            // Try different possible LPS column names
            const lpsValue = row['Nama LPS'] || row['NAMA LPS'] || row['LPS'] ||
                row['Nama_LPS'] || row['nama_lps'] || 'TIDAK ADA';
            const ketuaValue = row['Nama Ketua LPS'] || row['NAMA KETUA LPS'] ||
                row['Ketua LPS'] || 'TIDAK ADA';

            console.log(`  Nama LPS: "${lpsValue}"`);
            console.log(`  Ketua LPS: "${ketuaValue}"`);
            console.log('');
        }
    });
}

main();
