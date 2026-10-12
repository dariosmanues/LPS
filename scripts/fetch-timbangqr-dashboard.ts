async function main() {
  const loginRes = await fetch('https://timbangqr-ocr-led.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lps.local', password: 'Admin123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) {
    console.error('Login failed, no cookie');
    return;
  }
  const transHtmlRes = await fetch('https://timbangqr-ocr-led.vercel.app/transaksi', {
    headers: { 'Cookie': cookie }
  });
  const html = await transHtmlRes.text();
  console.log('HTML length:', html.length);

  // Extract ticket numbers
  const tickets = [...html.matchAll(/INV\/26\/\d+/g)].map(m => m[0]);
  const uniqueTickets = Array.from(new Set(tickets));
  console.log('Found tickets in HTML:', uniqueTickets.length);
  console.log('First 10 tickets:', uniqueTickets.slice(0, 10));
  console.log('Last 10 tickets:', uniqueTickets.slice(-10));
}

main().catch(console.error);
