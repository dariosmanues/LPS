import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const armadas = await prisma.armada.findMany({
        take: 10,
        select: {
            platNomor: true,
            tanggalTerbitIzin: true,
        }
    });

    console.log('Sample Armada data (checking tanggalTerbitIzin):');
    let hasDate = 0;
    let noDate = 0;
    armadas.forEach((a) => {
        if (a.tanggalTerbitIzin) {
            hasDate++;
            console.log(`  ${a.platNomor}: ${a.tanggalTerbitIzin.toISOString()}`);
        } else {
            noDate++;
            console.log(`  ${a.platNomor}: NULL`);
        }
    });
    console.log(`\nTotal with date: ${hasDate}, without: ${noDate}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
