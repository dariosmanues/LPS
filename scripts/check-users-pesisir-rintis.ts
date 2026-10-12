import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { kelurahan: { nama: { in: ['Pesisir', 'Rintis'], mode: 'insensitive' } } },
        { email: { contains: 'pesisir' } },
        { email: { contains: 'rintis' } }
      ]
    },
    include: {
      kelurahan: true
    }
  });

  console.log('=== USERS FOR PESISIR & RINTIS ===');
  console.log(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    kelurahan: u.kelurahan?.nama
  })));

  await prisma.$disconnect();
}

main().catch(console.error);
