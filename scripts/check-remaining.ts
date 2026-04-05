
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const missing = await prisma.armada.findMany({
        where: { kelurahanId: null }
    });
    console.log(`Remaining missing kelurahan: ${missing.length}`);
    missing.forEach(m => console.log(`- ${m.namaLps}`));
}

main();
