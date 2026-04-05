
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const targetPlates = [
    'BM 8361 TJ',
    'BK 9941 VO',
    'BM 9601 TZ',
    'BM 8729 PI',
    'BM 8936 TD',
    'BM 8392 QE',
    'BK 9941 VO',
    'BM 8273 QM'
];

async function main() {
    console.log('--- Checking Specific Plates in DB ---');

    for (const plat of targetPlates) {
        // Search fuzzy
        const normalizedInput = plat.replace(/\s+/g, '').toUpperCase();

        const allArmadas = await prisma.armada.findMany({
            select: { id: true, platNomor: true, namaLps: true, namaSupir: true }
        });

        const matches = allArmadas.filter(a =>
            a.platNomor.replace(/\s+/g, '').toUpperCase() === normalizedInput
        );

        if (matches.length > 0) {
            console.log(`\nPlate: ${plat} (Normalized: ${normalizedInput})`);
            console.log(`Found ${matches.length} records:`);
            matches.forEach(m => {
                console.log(`  - ID: ${m.id}`);
                console.log(`    Plat DB: "${m.platNomor}"`);
                console.log(`    LPS: ${m.namaLps}`);
                console.log(`    Supir: ${m.namaSupir}`);
            });
        } else {
            console.log(`\nPlate: ${plat} -> NOT FOUND in DB`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
