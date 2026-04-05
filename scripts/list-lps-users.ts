
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.user.findMany({
        where: {
            role: { in: ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'] }
        },
        select: {
            email: true,
            role: true,
            kelurahan: { select: { nama: true } }
        },
        orderBy: { kelurahan: { nama: 'asc' } }
    });

    console.log('Akun LPS yang tersedia:');
    users.forEach(user => {
        console.log(`[${user.kelurahan?.nama}] ${user.role}: ${user.email}`);
    });
}

listUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
