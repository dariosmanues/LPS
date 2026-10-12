import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const arm = await prisma.armada.findMany({
    where: {
      platNomor: { contains: '8716', mode: 'insensitive' }
    },
    include: { kelurahan: true }
  });
  console.log('Armada BM 8716 QK in LPS DB:', arm);

  await prisma.$disconnect();
}

main().catch(console.error);
