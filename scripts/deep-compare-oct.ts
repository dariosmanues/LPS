import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const loginRes = await fetch('https://timbangqr-ocr-led.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lps.local', password: 'Admin123!' })
  });
  const cookie = loginRes.headers.get('set-cookie')!;

  const htmlRes = await fetch('https://timbangqr-ocr-led.vercel.app/transaksi?month=2026-10', {
    headers: { 'Cookie': cookie }
  });
  const html = await htmlRes.text();

  // Extract table rows:
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) rows.push(m[1]);

  const timbangMap = new Map<string, { date: string; plate: string; lps: string; netto: number }>();
  for (const r of rows.slice(1)) {
    const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c =>
      c[1].replace(/<[^>]+>/g, '').trim()
    );
    if (cells.length >= 10) {
      // 0: Tanggal, 1: No. Tiket, 2: Plat, 3: Supir, 4: LPS, 5: Jenis, 6: Gross, 7: Tare, 8: Rafaksi, 9: Netto 2
      const date = cells[0];
      const ticket = cells[1];
      const plate = cells[2];
      const lps = cells[4];
      const netto = parseInt(cells[9].replace(/[^0-9]/g, ''), 10) || 0;
      timbangMap.set(ticket, { date, plate, lps, netto });
    }
  }

  console.log(`TimbangQR Oct 2026 tickets count: ${timbangMap.size}`);
  let timbangTotalKg = 0;
  let todayCount = 0;
  let todayKg = 0;
  let beforeTodayCount = 0;
  let beforeTodayKg = 0;

  timbangMap.forEach((v, ticket) => {
    timbangTotalKg += v.netto;
    if (v.date.includes('12 Okt 2026')) {
      todayCount++;
      todayKg += v.netto;
    } else {
      beforeTodayCount++;
      beforeTodayKg += v.netto;
    }
  });

  console.log(`TimbangQR Total Netto Kg: ${timbangTotalKg.toLocaleString('id-ID')} kg`);
  console.log(`- Hari Ini (12 Okt 2026): ${todayCount} transaksi, ${todayKg.toLocaleString('id-ID')} kg`);
  console.log(`- Sebelum Hari Ini (10-11 Okt): ${beforeTodayCount} transaksi, ${beforeTodayKg.toLocaleString('id-ID')} kg`);

  // LPS DB October logs
  const lpsOctLogs = await prisma.wasteLog.findMany({
    where: {
      recordedAt: {
        gte: new Date('2026-10-01T00:00:00Z'),
        lt: new Date('2026-11-01T00:00:00Z')
      }
    },
    include: {
      timbangQrSync: true,
      armada: true
    }
  });

  console.log(`\nLPS DB Oct 2026 logs count: ${lpsOctLogs.length}`);
  let lpsTotalKg = 0;
  lpsOctLogs.forEach(l => lpsTotalKg += Number(l.beratKg));
  console.log(`LPS DB Oct 2026 Total Kg: ${lpsTotalKg.toLocaleString('id-ID')} kg`);

  // Tickets comparison
  const missingInLps: string[] = [];
  timbangMap.forEach((v, ticket) => {
    const found = lpsOctLogs.find(l => l.timbangQrSync?.ticketNumber === ticket);
    if (!found) missingInLps.push(`${ticket} (${v.netto} kg on ${v.date})`);
  });
  console.log('\nTickets in TimbangQR but missing in LPS DB:', missingInLps);

  const extraInLps: string[] = [];
  lpsOctLogs.forEach(l => {
    const t = l.timbangQrSync?.ticketNumber;
    if (t && !timbangMap.has(t)) {
      extraInLps.push(`${t} (${Number(l.beratKg)} kg)`);
    }
  });
  console.log('Tickets in LPS DB but not in TimbangQR Oct:', extraInLps);

  await prisma.$disconnect();
}

main().catch(console.error);
