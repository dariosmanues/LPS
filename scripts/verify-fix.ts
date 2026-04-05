
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const logFile = 'verification_output.txt';

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function main() {
    fs.writeFileSync(logFile, '');
    log('=== VERIFICATION OF FIX ===\n');

    const targets = ['Tuah Mulia', 'amanah bersama', 'ceria'];

    // Check coverage
    const allArmada = await prisma.armada.findMany({
        where: {
            OR: targets.map(t => ({ namaLps: { contains: t } })) // simplified
        },
        include: {
            kelurahan: true
        }
    });

    log(`Found ${allArmada.length} target armadas.`);

    let allFixed = true;
    for (const armada of allArmada) {
        log(`- [${armada.namaLps}]`);
        log(`  Kelurahan: ${armada.kelurahan ? armada.kelurahan.nama : '❌ NULL (STILL MISSING!)'}`);
        if (!armada.kelurahan) allFixed = false;
    }

    if (allFixed) {
        log('\n✅ ALL TARGETS HAVE KELURAHAN ASSIGNED.');
    } else {
        log('\n❌ SOME TARGETS ARE STILL MISSING KELURAHAN.');
    }
}

main()
    .catch(log)
    .finally(() => prisma.$disconnect());
