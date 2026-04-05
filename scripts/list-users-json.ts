
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsersJson() {
    const users = await prisma.user.findMany({
        take: 100,
        select: {
            email: true,
            role: true
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

listUsersJson()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
