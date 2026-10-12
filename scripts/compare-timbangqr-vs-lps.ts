import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const loginRes = await fetch('https://timbangqr-ocr-led.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lps.local', password: 'Admin123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) throw new Error('No cookie');

  // Fetch transactions for October 2026
  const transHtmlRes = await fetch('https://timbangqr-ocr-led.vercel.app/transaksi?month=2026-10', {
    headers: { 'Cookie': cookie }
  });
  const html = await transHtmlRes.text();

  // Also fetch dashboard HTML to see exactly what numbers it renders
  const dashHtmlRes = await fetch('https://timbangqr-ocr-led.vercel.app/dashboard', {
    headers: { 'Cookie': cookie }
  });
  const dashHtml = await dashHtmlRes.text();

  console.log('=== TIMBANGQR OCTOBER 2026 TRANSACTIONS PARSING ===');
  // Match table rows in transaksi HTML:
  // Each row has ticket, date, plate, driver, lps, gross, tare, rafaksi, netto, ritasi, status
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) {
    rows.push(m[1]);
  }

  // Filter header row
  const dataRows = rows.slice(1);
  console.log(`Found ${dataRows.length} table rows in /transaksi?month=2026-10`);

  interface TimbangRow {
    ticket: string;
    date: string;
    plate: string;
    driver: string;
    lps: string;
    nettoKg: number;
  }

  const parsedTimbang: TimbangRow[] = [];

  for (const r of dataRows) {
    const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c =>
      c[1].replace(/<[^>]+>/g, '').trim()
    );
    if (cells.length >= 7) {
      const ticket = cells[0];
      const date = cells[1];
      const plate = cells[2];
      const driver = cells[3];
      const lps = cells[4];
      const nettoStr = cells[8] || cells[7];
      const nettoKg = parseInt(nettoStr.replace(/[^0-9]/g, ''), 10) || 0;
      parsedTimbang.push({ ticket, date, plate, driver, lps, nettoKg });
    }
  }

  console.log(`Parsed ${parsedTimbang.length} transactions from TimbangQR`);
  const totalTimbangKg = parsedTimbang.reduce((sum, r) => sum + r.nettoKg, 0);
  console.log(`Total Netto Kg from parsed rows: ${totalTimbangKg.toLocaleString('id-ID')} kg`);

  // Now query LPS DB
  const allSyncedLps = await prisma.timbangQrSync.findMany({
    include: { wasteLog: true }
  });
  const lpsSyncedTickets = new Set(allSyncedLps.map(s => s.ticketNumber));

  console.log(`Total tickets recorded in LPS timbangQrSync table: ${lpsSyncedTickets.size}`);

  // Find which tickets are in TimbangQR but MISSING in LPS DB
  const missingInLps = parsedTimbang.filter(t => !lpsSyncedTickets.has(t.ticket));
  console.log(`\n=== MISSING IN LPS DB (${missingInLps.length} tickets) ===`);
  let missingTotalKg = 0;
  missingInLps.forEach(t => {
    console.log(`  - Ticket: ${t.ticket} | Date: ${t.date} | Plat: ${t.plate} | LPS: ${t.lps} | Netto: ${t.nettoKg} kg`);
    missingTotalKg += t.nettoKg;
  });
  console.log(`Total missing kg: ${missingTotalKg.toLocaleString('id-ID')} kg`);

  // Also check if any tickets in LPS are not in TimbangQR
  const timbangTicketSet = new Set(parsedTimbang.map(t => t.ticket));
  const missingInTimbang = Array.from(lpsSyncedTickets).filter(t => !timbangTicketSet.has(t));
  console.log(`\n=== IN LPS BUT NOT IN TIMBANGQR OCT 2026 (${missingInTimbang.length} tickets) ===`);
  missingInTimbang.forEach(t => console.log(`  - ${t}`));

  await prisma.$disconnect();
}

main().catch(console.error);
