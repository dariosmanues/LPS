import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findMissingUsers() {
    console.log('🔍 Finding kelurahan with incomplete users...\n');

    const kelurahanList = await prisma.kelurahan.findMany({
        include: {
            users: {
                where: {
                    role: { in: ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'] }
                }
            }
        }
    });

    const incomplete = kelurahanList.filter(k => k.users.length < 3);

    if (incomplete.length === 0) {
        console.log('✅ All kelurahan have 3 users!');
    } else {
        console.log(`⚠️  Found ${incomplete.length} kelurahan with incomplete users:\n`);
        incomplete.forEach(k => {
            console.log(`📍 ${k.nama}`);
            console.log(`   Current users: ${k.users.length}`);
            console.log(`   Missing: ${3 - k.users.length} users`);
            console.log(`   Existing roles: ${k.users.map(u => u.role).join(', ')}`);
            console.log('');
        });
    }
}

findMissingUsers().finally(() => prisma.$disconnect());
