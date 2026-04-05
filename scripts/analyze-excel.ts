import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// Simple script to analyze Excel structure
const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data: any[] = XLSX.utils.sheet_to_json(worksheet);

const analysis = {
    sheetName,
    totalRows: data.length,
    columns: data.length > 0 ? Object.keys(data[0]) : [],
    sampleRows: data.slice(0, 3)
};

fs.writeFileSync('excel-analysis.json', JSON.stringify(analysis, null, 2), 'utf8');
console.log('Analysis saved to excel-analysis.json');
console.log(`Columns found: ${analysis.columns.length}`);
console.log(`Total rows: ${analysis.totalRows}`);
