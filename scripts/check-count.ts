
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.armada.count();
    console.log(`Total Armada in DB: ${count}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
