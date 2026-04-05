import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Check specific armada from the Excel file
    const testPlates = ['BM 8106 QP', 'BM 8359 QN', 'BM 8622 QP'];

    for (const plate of testPlates) {
        const armada = await prisma.armada.findUnique({
            where: { platNomor: plate },
            select: {
                platNomor: true,
                namaLps: true,
                tanggalTerbitIzin: true,
            }
        });

        if (armada) {
            console.log(`${armada.platNomor} (${armada.namaLps}):`);
            console.log(`  tanggalTerbitIzin: ${armada.tanggalTerbitIzin ? armada.tanggalTerbitIzin.toISOString() : 'NULL'}`);
        } else {
            console.log(`${plate}: NOT FOUND`);
        }
    }

    // Count total records with and without dates
    const withDates = await prisma.armada.count({
        where: { tanggalTerbitIzin: { not: null } }
    });
    const withoutDates = await prisma.armada.count({
        where: { tanggalTerbitIzin: null }
    });

    console.log(`\nTotal armada with tanggalTerbitIzin: ${withDates}`);
    console.log(`Total armada without tanggalTerbitIzin: ${withoutDates}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
