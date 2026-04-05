
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== CEK DATA LPS ===\n');

    // SQLite default might not support mode: 'insensitive' universally depending on collation, 
    // so we'll just search normally and filter or use multiple ORs if capitalization is unsure.
    // But usually simple contains works fine.

    console.log('Searching for Armadas...');
    const allArmada = await prisma.armada.findMany({
        where: {
            OR: [
                { namaLps: { contains: 'Tuah' } },
                { namaLps: { contains: 'Mulia' } },
                { namaLps: { contains: 'amanah' } },
                { namaLps: { contains: 'Amanah' } },
                { namaLps: { contains: 'ceria' } },
                { namaLps: { contains: 'Ceria' } },
            ]
        },
        include: {
            kelurahan: {
                include: {
                    kecamatan: true
                }
            }
        }
    });

    console.log(`Found ${allArmada.length} matches.`);

    // Filter in memory to be precise about the specific names we care about if needed, 
    // but looking at all matches is helpful.
    const targets = ['Tuah Mulia', 'amanah bersama', 'ceria'];

    allArmada.forEach(a => {
        // Simple case-insensitive check for display
        const isTarget = targets.some(t => a.namaLps.toLowerCase().includes(t.toLowerCase()));
        if (isTarget) {
            console.log(`[TARGET] Found "${a.namaLps}"`);
            console.log(`  - ID: ${a.id}`);
            console.log(`  - Plat: ${a.platNomor}`);
            console.log(`  - Current Kelurahan: ${a.kelurahan ? a.kelurahan.nama : 'NULL (Data Tanpa Kelurahan)'}`);
        } else {
            // console.log(`[OTHER] "${a.namaLps}"`);
        }
    });

    console.log('\n=== CEK KELURAHAN TARGET ===');
    const targetKelurahan = ['sukamulia', 'kedungsari', 'sialang rampai'];
    const kelurahans = await prisma.kelurahan.findMany({
        include: {
            kecamatan: true
        }
    });

    const matches = kelurahans.filter(k =>
        targetKelurahan.some(t => k.nama.toLowerCase().includes(t.toLowerCase()))
    );

    matches.forEach(k => {
        console.log(`- Kelurahan: ${k.nama} (Kec: ${k.kecamatan.nama})`);
        console.log(`  - ID: ${k.id}`);
    });
}

main()
    .catch(e => {
        console.error('Error running script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
