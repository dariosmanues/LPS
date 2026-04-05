import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = path.join(__dirname, '..', 'REKAP ARMADA TAHUN 2026.xlsx');

console.log('Reading Excel file:', excelPath);

const buffer = fs.readFileSync(excelPath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(sheet);

console.log('\n=== COLUMN NAMES ===');
if (jsonData.length > 0) {
    const firstRow = jsonData[0] as any;
    const columns = Object.keys(firstRow);
    columns.forEach((col, i) => {
        console.log(`${i + 1}. "${col}"`);
    });

    console.log('\n=== SAMPLE DATA (First 3 rows) ===');
    jsonData.slice(0, 3).forEach((row: any, idx) => {
        console.log(`\n--- Row ${idx + 1} ---`);
        // Look for date-related columns
        columns.forEach(col => {
            if (col.toLowerCase().includes('tanggal') || col.toLowerCase().includes('terbit') || col.toLowerCase().includes('izin')) {
                console.log(`  ${col}: "${row[col]}" (type: ${typeof row[col]})`);
            }
        });
    });
}
