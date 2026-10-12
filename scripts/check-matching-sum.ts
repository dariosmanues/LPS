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

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) rows.push(m[1]);

  const timbangTickets = new Set<string>();
  for (const r of rows.slice(1)) {
    const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c =>
      c[1].replace(/<[^>]+>/g, '').trim()
    );
    if (cells.length >= 2) {
      timbangTickets.add(cells[1]);
    }
  }

  console.log('TimbangQR Oct 2026 tickets count:', timbangTickets.size);

  // In LPS DB:
  const lpsSyncs = await prisma.timbangQrSync.findMany({
    where: {
      ticketNumber: { in: Array.from(timbangTickets) }
    },
    include: { wasteLog: true }
  });

  console.log(`LPS DB tickets matching TimbangQR Oct: ${lpsSyncs.length}`);
  const sumKg = lpsSyncs.reduce((sum, s) => sum + Number(s.wasteLog?.beratKg || s.nettoKg), 0);
  console.log(`Sum Kg in LPS DB for these ${lpsSyncs.length} tickets: ${sumKg.toLocaleString('id-ID')} kg`);

  await prisma.$disconnect();
}

main().catch(console.error);
