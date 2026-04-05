
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const logFile = 'kelurahan_check_output.txt';

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function main() {
    fs.writeFileSync(logFile, '');
    log('=== CHECK KELURAHAN NAMES (Suka) ===');
    const kelurahans = await prisma.kelurahan.findMany({
        where: {
            nama: { contains: 'Suka' }
        }
    });

    kelurahans.forEach(k => log(`"${k.nama}" (ID: ${k.id})`));
}

main().finally(() => prisma.$disconnect());
