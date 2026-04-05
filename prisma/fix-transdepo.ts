import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTransdepo() {
    console.log('Fixing transdepo assignments...');

    // Update operator HJ
    const hjResult = await prisma.user.updateMany({
        where: {
            OR: [
                { email: { contains: 'hj' } },
                { name: { contains: 'Harapan Jaya' } },
            ],
        },
        data: {
            transdepo: 'HARAPAN_JAYA',
        },
    });
    console.log(`Updated ${hjResult.count} Harapan Jaya operators`);

    // Update operator AH
    const ahResult = await prisma.user.updateMany({
        where: {
            OR: [
                { email: { contains: 'ah' } },
                { name: { contains: 'Air Hitam' } },
            ],
        },
        data: {
            transdepo: 'AIR_HITAM',
        },
    });
    console.log(`Updated ${ahResult.count} Air Hitam operators`);

    // Set default transdepo for ALL operators/gatekeepers that don't have one
    const defaultResult = await prisma.user.updateMany({
        where: {
            role: { in: ['OPERATOR', 'GATEKEEPER'] },
            transdepo: null,
        },
        data: {
            transdepo: 'HARAPAN_JAYA', // Default to Harapan Jaya
        },
    });
    console.log(`Set default transdepo for ${defaultResult.count} users without assignment`);

    // Show all users
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, transdepo: true, role: true },
    });
    console.log('\nAll users:');
    users.forEach(u => console.log(`- ${u.email} | ${u.role} | transdepo: ${u.transdepo || 'NOT SET'}`));

    await prisma.$disconnect();
}

fixTransdepo().catch(console.error);

