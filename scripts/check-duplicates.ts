
import XLSX from 'xlsx';
import * as path from 'path';

async function main() {
    console.log('--- Analyzing Duplicates in Excel ---');

    try {
        const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const seenPlats = new Set<string>();
        const duplicates: string[] = [];

        console.log(`Scanning ${excelData.length} rows...`);

        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            let plat = row['Nomor Polisi'];

            if (plat) {
                // Normalize: Remove all spaces, uppercase
                const normalized = String(plat).replace(/\s+/g, '').toUpperCase();

                if (seenPlats.has(normalized)) {
                    duplicates.push(`${plat} (Row ${i + 2})`); // +2 because 0-indexed + header
                } else {
                    seenPlats.add(normalized);
                }
            }
        }

        console.log(`\nFound ${duplicates.length} Duplicates:`);
        duplicates.forEach(d => console.log(`- ${d}`));

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
