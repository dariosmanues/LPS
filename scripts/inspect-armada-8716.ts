async function main() {
  const loginRes = await fetch('https://timbangqr-ocr-led.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lps.local', password: 'Admin123!' })
  });
  const cookie = loginRes.headers.get('set-cookie')!;

  const htmlRes = await fetch('https://timbangqr-ocr-led.vercel.app/armada?q=8716', {
    headers: { 'Cookie': cookie }
  });
  const html = await htmlRes.text();

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) rows.push(m[1]);

  console.log(`Matching rows for 8716 in TimbangQR armada: ${rows.length - 1}`);
  for (const r of rows.slice(1)) {
    const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c =>
      c[1].replace(/<[^>]+>/g, '').trim()
    );
    console.log('Armada 8716 in TimbangQR:', cells);
  }
}

main().catch(console.error);
