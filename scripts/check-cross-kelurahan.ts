import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== CEK DUPLIKAT PLAT DI KELURAHAN BERBEDA ===\n');

    const allArmadas = await prisma.armada.findMany({
        select: {
            id: true,
            platNomor: true,
            namaLps: true,
            kelurahanId: true,
            kelurahan: {
                select: {
                    nama: true,
                    kecamatan: {
                        select: {
                            nama: true
                        }
                    }
                }
            }
        }
    });

    console.log(`Total Armada: ${allArmadas.length}\n`);

    // Group by normalized plate
    const plateMap = new Map<string, any[]>();

    for (const armada of allArmadas) {
        const normalized = armada.platNomor.replace(/\s+/g, '').toUpperCase();
        if (!plateMap.has(normalized)) {
            plateMap.set(normalized, []);
        }
        plateMap.get(normalized)?.push(armada);
    }

    // Find plates with different kelurahan
    const crossKelurahanIssues: any[] = [];

    plateMap.forEach((records, normalizedPlate) => {
        if (records.length > 1) {
            // Check if kelurahan are different
            const kelurahanIds = new Set(records.map(r => r.kelurahanId || 'NULL'));

            if (kelurahanIds.size > 1) {
                crossKelurahanIssues.push({
                    plate: normalizedPlate,
                    records: records
                });
            }
        }
    });

    console.log('=== HASIL ANALISIS ===\n');

    if (crossKelurahanIssues.length === 0) {
        console.log('✓ TIDAK ADA plat yang terdaftar di kelurahan berbeda.');
        console.log('✓ Setiap nomor plat hanya terdaftar di satu kelurahan.\n');
    } else {
        console.log(`⚠️  DITEMUKAN ${crossKelurahanIssues.length} PLAT YANG TERDAFTAR DI KELURAHAN BERBEDA!\n`);

        crossKelurahanIssues.forEach((issue, idx) => {
            console.log(`${idx + 1}. Plat: ${issue.plate} (${issue.records.length} record)`);
            issue.records.forEach((rec: any, i: number) => {
                const kelurahanInfo = rec.kelurahan
                    ? `${rec.kelurahan.nama} (Kec. ${rec.kelurahan.kecamatan.nama})`
                    : 'TIDAK ADA KELURAHAN';

                console.log(`   [${i + 1}] Plat DB: "${rec.platNomor}"`);
                console.log(`       LPS: ${rec.namaLps}`);
                console.log(`       Kelurahan: ${kelurahanInfo}`);
            });
            console.log('');
        });
    }

    // Summary
    console.log('=== RINGKASAN ===');
    console.log(`Total Plat yang Duplikat: ${Array.from(plateMap.values()).filter(r => r.length > 1).length}`);
    console.log(`Duplikat di Kelurahan Berbeda: ${crossKelurahanIssues.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
