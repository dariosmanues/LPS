import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickCount() {
    const total = await prisma.user.count({
        where: { role: { in: ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'] } }
    });
    const kelurahan = await prisma.kelurahan.count();

    console.log(`Kelurahan: ${kelurahan}`);
    console.log(`LPS Users: ${total}`);
    console.log(`Expected: ${kelurahan * 3}`);
    console.log(`Status: ${total === kelurahan * 3 ? 'SUCCESS ✅' : 'INCOMPLETE ⚠️'}`);
}

quickCount().finally(() => prisma.$disconnect());
