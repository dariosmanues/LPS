export {};

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

  // Match table rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) rows.push(m[1]);

  const dataRows = rows.slice(1);
  const items: any[] = [];
  for (const r of dataRows) {
    const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c =>
      c[1].replace(/<[^>]+>/g, '').trim()
    );
    if (cells.length >= 9) {
      const ticket = cells[0];
      const date = cells[1];
      const plate = cells[2];
      const lps = cells[4];
      const nettoStr = cells[8];
      const nettoKg = parseInt(nettoStr.replace(/[^0-9]/g, ''), 10) || 0;
      items.push({ ticket, date, plate, lps, nettoKg });
    }
  }

  console.log(`Total transactions in TimbangQR for Oct 2026: ${items.length}`);
  const totalKg = items.reduce((s, i) => s + i.nettoKg, 0);
  console.log(`Total Kg: ${totalKg.toLocaleString('id-ID')} kg`);

  // Group by date text (e.g. "12 Okt 2026", "11 Okt 2026", etc.)
  const byDate = new Map<string, { count: number; kg: number; tickets: string[] }>();
  for (const item of items) {
    // date cell looks like "12 Okt 2026, 17.11"
    const datePart = item.date.split(',')[0].trim();
    const curr = byDate.get(datePart) || { count: 0, kg: 0, tickets: [] };
    curr.count++;
    curr.kg += item.nettoKg;
    curr.tickets.push(item.ticket);
    byDate.set(datePart, curr);
  }

  console.log('\n=== BREAKDOWN PER TANGGAL DI TIMBANGQR (OKTOBER 2026) ===');
  byDate.forEach((val, key) => {
    console.log(`Tanggal: ${key} -> ${val.count} transaksi, ${val.kg.toLocaleString('id-ID')} kg`);
    if (val.count <= 10) {
      console.log(`  Tickets: ${val.tickets.join(', ')}`);
    }
  });
}

main().catch(console.error);
