import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function check() {
  console.log('=== CHECK BK 9941 VO IN DB ===');
  const armadas = await prisma.armada.findMany({
    where: { platNomor: { contains: '9941' } },
    include: { kelurahan: { include: { kecamatan: true } } }
  });
  console.log('DB BK 9941 VO:', JSON.stringify(armadas, null, 2));

  console.log('=== CHECK BK 9941 VO IN EXCEL ===');
  const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
  const workbook = XLSX.readFile(filePath);
  for (const sName of workbook.SheetNames) {
    const ws = workbook.Sheets[sName];
    const data = XLSX.utils.sheet_to_json(ws);
    const matches = data.filter(row => JSON.stringify(row).toLowerCase().includes('9941'));
    console.log(`Sheet "${sName}" matches count:`, matches.length);
    console.log('Matches:', JSON.stringify(matches, null, 2));
  }

  console.log('=== CHECK KOTA TINGGI IN EXCEL ===');
  for (const sName of workbook.SheetNames) {
    const ws = workbook.Sheets[sName];
    const data = XLSX.utils.sheet_to_json(ws);
    const matches = data.filter(row => JSON.stringify(row).toLowerCase().includes('kota tinggi'));
    console.log(`Sheet "${sName}" Kota Tinggi count:`, matches.length);
    console.log('Kota Tinggi rows:', JSON.stringify(matches, null, 2));
  }

  await prisma.$disconnect();
}

check().catch(console.error);
