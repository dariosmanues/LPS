import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allLogs = await prisma.wasteLog.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 10,
    include: {
      timbangQrSync: true,
      armada: true,
      user: true
    }
  });
  console.log('=== LATEST 10 WASTE LOGS IN LPS DB ===');
  allLogs.forEach(l => {
    console.log({
      id: l.id,
      recordedAt: l.recordedAt.toISOString(),
      beratKg: l.beratKg.toString(),
      plat: l.armada?.platNomor,
      lps: l.armada?.namaLps,
      ticket: l.timbangQrSync?.ticketNumber,
      userTransdepo: l.user?.transdepo
    });
  });

  // Check total logs and date distribution in LPS DB
  const count = await prisma.wasteLog.count();
  console.log('\nTotal waste logs in LPS DB:', count);

  // Group by date
  const dateGroups = await prisma.$queryRaw<any[]>`
    SELECT to_char(timezone('Asia/Jakarta', recorded_at), 'YYYY-MM-DD') as date_str,
           count(*)::int as count,
           sum(berat_kg)::bigint as total_kg
    FROM waste_logs
    GROUP BY date_str
    ORDER BY date_str DESC
  `;
  console.log('\n=== WASTE LOGS GROUPED BY DATE (Asia/Jakarta) ===');
  console.log(dateGroups);

  // Today stats in UTC vs Asia/Jakarta
  const now = new Date();
  console.log('\nCurrent Server time:', now.toISOString());

  // Check today's date range according to waste-stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayCount = await prisma.wasteLog.count({
    where: { recordedAt: { gte: today, lt: tomorrow } }
  });
  const todaySum = await prisma.wasteLog.aggregate({
    where: { recordedAt: { gte: today, lt: tomorrow } },
    _sum: { beratKg: true }
  });
  console.log('\nToday range (setHours 0,0,0,0 local):', {
    from: today.toISOString(),
    to: tomorrow.toISOString(),
    count: todayCount,
    sum: todaySum._sum.beratKg?.toString()
  });

  await prisma.$disconnect();
}

main().catch(console.error);
