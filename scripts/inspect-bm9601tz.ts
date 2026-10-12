import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.armada.findMany({
    where: {
      platNomor: 'BM 9601 TZ'
    },
    include: {
      kelurahan: {
        include: { kecamatan: true }
      },
      wasteLogs: true
    }
  });

  console.log('=== FULL DETAILS OF BM 9601 TZ RECORDS ===');
  console.log(JSON.stringify(records, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
