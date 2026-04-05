
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Analyzing Data Discrepancy ---');

    try {
        // 1. Read Excel
        const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval to avoid empty cells causing issues

        console.log(`Checking Excel at: ${filePath}`);

        const excelPlats = new Set<string>();
        const excelRowsMap = new Map<string, any>();

        const fs = require('fs');
        const duplicates: string[] = [];
        for (const row of excelData) {
            let plat = row['Nomor Polisi'];
            if (plat) {
                plat = String(plat).replace(/\s+/g, ' ').trim();
                if (excelPlats.has(plat)) {
                    duplicates.push(plat);
                }
                excelPlats.add(plat);
                excelRowsMap.set(plat, row);
            }
        }
        fs.writeFileSync('duplicates.txt', duplicates.join('\n'));
        fs.writeFileSync('report.txt', `Unique in Excel: ${excelPlats.size}\n`);

        console.log(`Unique Plat Numbers in Excel: ${excelPlats.size}`);

        // 2. Read DB
        const dbArmadas = await prisma.armada.findMany({
            select: { platNomor: true, id: true, namaLps: true }
        });

        const dbPlats = new Set<string>();
        for (const arma of dbArmadas) {
            if (arma.platNomor) {
                const normalized = arma.platNomor.replace(/\s+/g, ' ').trim();
                dbPlats.add(normalized);
            }
        }

        console.log(`Unique Plat Numbers in DB: ${dbPlats.size}`);

        // 3. Find Missing in DB (Present in Excel, Not in DB)
        const missingInDb: string[] = [];
        for (const plat of excelPlats) {
            if (!dbPlats.has(plat)) {
                missingInDb.push(plat);
            }
        }

        // 4. Find Extra in DB (Present in DB, Not in Excel)
        const extraInDb: string[] = [];
        for (const plat of dbPlats) {
            if (!excelPlats.has(plat)) {
                extraInDb.push(plat);
            }
        }

        console.log(`\n--- REPORT ---`);
        console.log(`Missing in DB (${missingInDb.length}):`);
        missingInDb.forEach(p => console.log(`- ${p}`));

        console.log(`\nExtra in DB (${extraInDb.length}):`);
        extraInDb.forEach(p => console.log(`- ${p}`));

    } catch (err) {
        console.error("An error occurred during verification:", err);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
