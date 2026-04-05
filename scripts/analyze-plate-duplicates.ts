
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== ANALISIS DUPLIKASI NOMOR PLAT ===\n');

    const allArmadas = await prisma.armada.findMany({
        select: {
            id: true,
            platNomor: true,
            namaLps: true,
            namaSupir: true
        }
    });

    // Group by normalized plate
    const plateMap = new Map<string, any[]>();

    for (const armada of allArmadas) {
        const normalized = armada.platNomor.replace(/\s+/g, '').toUpperCase();
        if (!plateMap.has(normalized)) {
            plateMap.set(normalized, []);
        }
        plateMap.get(normalized)?.push(armada);
    }

    // Find duplicates
    const duplicates: any[] = [];
    plateMap.forEach((records, normalizedPlate) => {
        if (records.length > 1) {
            duplicates.push({ normalizedPlate, records });
        }
    });

    console.log(`Total Armada di DB: ${allArmadas.length}`);
    console.log(`Total Plat Unik (normalized): ${plateMap.size}`);
    console.log(`Total Plat yang Duplikat: ${duplicates.length}\n`);

    if (duplicates.length > 0) {
        console.log('=== PLAT YANG DUPLIKAT ===\n');
        duplicates.forEach(dup => {
            console.log(`Plat: ${dup.normalizedPlate}`);
            console.log(`Jumlah Record: ${dup.records.length}`);
            dup.records.forEach((rec: any, idx: number) => {
                console.log(`  [${idx + 1}] Plat DB: "${rec.platNomor}"`);
                console.log(`      LPS: ${rec.namaLps}`);
                console.log(`      Supir: ${rec.namaSupir || '-'}`);
            });
            console.log('');
        });
    } else {
        console.log('✓ Tidak ada duplikasi plat di database.');
        console.log('✓ Semua nomor plat bersifat UNIK.\n');
    }

    // Check the specific plates from user's Excel list
    const excelDuplicates = [
        'BM 8361 TJ', 'BK 9941 VO', 'BM 9601 TZ', 'BM 8729 PI',
        'BM 8936 TD', 'BM 8392 QE', 'BM 8273 QM'
    ];

    console.log('=== CEK PLAT DARI EXCEL (Yang Duplikat di Excel) ===\n');
    for (const plate of excelDuplicates) {
        const normalized = plate.replace(/\s+/g, '').toUpperCase();
        const found = plateMap.get(normalized);

        if (found && found.length === 1) {
            console.log(`${plate} → ADA di DB (1 record), LPS: ${found[0].namaLps}`);
        } else if (found && found.length > 1) {
            console.log(`${plate} → DUPLIKAT di DB (${found.length} records)!`);
        } else {
            console.log(`${plate} → TIDAK DITEMUKAN di DB`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
