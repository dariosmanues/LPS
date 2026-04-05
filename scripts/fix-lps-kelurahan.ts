
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const logFile = 'fix_log.txt';

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function main() {
    fs.writeFileSync(logFile, '');
    log('=== FIX DATA TANPA KELURAHAN (V3) ===\n');

    const fixes = [
        {
            lpsName: 'Tuah Mulia',
            kelurahanSearch: ['Sukamulya', 'Suka Mulya'] // Corrected from Sukamulia
        },
        {
            lpsName: 'Amanah Bersama',
            kelurahanSearch: ['Kedungsari', 'Kedung Sari']
        },
        {
            lpsName: 'Ceria',
            kelurahanSearch: ['Sialang Rampai', 'Sialangrampai']
        },
    ];

    for (const fix of fixes) {
        log(`Processing: ${fix.lpsName}`);

        // 1. Find the Kelurahan
        let kelurahan = null;
        for (const term of fix.kelurahanSearch) {
            kelurahan = await prisma.kelurahan.findFirst({
                where: { nama: { contains: term } }
            });
            if (kelurahan) {
                log(`   Found Kelurahan: "${kelurahan.nama}" (ID: ${kelurahan.id}) using term "${term}"`);
                break;
            }
        }

        if (!kelurahan) {
            log(`❌ Kelurahan not found for terms: ${fix.kelurahanSearch.join(', ')}`);
            continue;
        }

        // 2. Find the Armada(s)
        const armadas = await prisma.armada.findMany({
            where: {
                namaLps: { contains: fix.lpsName }
            }
        });

        if (armadas.length === 0) {
            log(`   ⚠️ No Armada found with name containing "${fix.lpsName}"`);
            continue;
        }

        log(`   Found ${armadas.length} Armada(s) to update.`);

        // 3. Update
        for (const armada of armadas) {
            // Check if already correct
            if (armada.kelurahanId === kelurahan.id) {
                log(`   - [${armada.namaLps}] already assigned to this Kelurahan.`);
                continue;
            }

            log(`   - Updating [${armada.namaLps}] (Current KelurahanID: ${armada.kelurahanId}) ...`);

            try {
                await prisma.armada.update({
                    where: { id: armada.id },
                    data: {
                        kelurahanId: kelurahan.id
                    }
                });
                log(`     ✅ Updated!`);
            } catch (error) {
                log(`     ❌ Error updating: ${error}`);
            }
        }
    }
}

main()
    .catch(e => {
        log(`FATAL ERROR: ${e}`);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
