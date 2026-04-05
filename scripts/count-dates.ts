import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const withDates = await prisma.armada.count({
        where: { tanggalTerbitIzin: { not: null } }
    });
    const withoutDates = await prisma.armada.count({
        where: { tanggalTerbitIzin: null }
    });

    console.log("WITH_DATES=" + withDates);
    console.log("WITHOUT_DATES=" + withoutDates);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
