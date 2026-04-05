
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectUsers() {
    const users = await prisma.user.findMany({
        where: {
            email: { contains: 'binawidya' }
        }
    });

    console.log('--- INSPECTION ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}`);
        console.log(`Email: "${u.email}" (Length: ${u.email.length})`);
        console.log(`Role: ${u.role}`);
        console.log('---');
    });
}

inspectUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
