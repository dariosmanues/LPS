import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyLpsUsers() {
    console.log('🔍 Verifying LPS users...\n');

    // Count kelurahan
    const kelurahanCount = await prisma.kelurahan.count();
    console.log(`📍 Total Kelurahan: ${kelurahanCount}`);

    // Count LPS users by role
    const ketuaCount = await prisma.user.count({ where: { role: 'LPS_KETUA' } });
    const sekretarisCount = await prisma.user.count({ where: { role: 'LPS_SEKRETARIS' } });
    const bendaharaCount = await prisma.user.count({ where: { role: 'LPS_BENDAHARA' } });
    const totalLpsUsers = ketuaCount + sekretarisCount + bendaharaCount;

    console.log(`\n👥 LPS Users by Role:`);
    console.log(`   • LPS_KETUA: ${ketuaCount}`);
    console.log(`   • LPS_SEKRETARIS: ${sekretarisCount}`);
    console.log(`   • LPS_BENDAHARA: ${bendaharaCount}`);
    console.log(`   • TOTAL LPS Users: ${totalLpsUsers}`);

    // Expected count
    const expected = kelurahanCount * 3;
    console.log(`\n✅ Expected: ${expected} users (${kelurahanCount} kelurahan × 3 roles)`);
    console.log(`📊 Actual: ${totalLpsUsers} users`);

    if (totalLpsUsers === expected) {
        console.log(`\n🎉 SUCCESS: All ${expected} users created correctly!`);
    } else {
        console.log(`\n⚠️  WARNING: Expected ${expected} but found ${totalLpsUsers}`);
    }

    // Show sample users
    console.log(`\n📋 Sample users (first 3):`);
    const sampleUsers = await prisma.user.findMany({
        where: { role: { in: ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'] } },
        take: 3,
        include: { kelurahan: true }
    });

    sampleUsers.forEach(user => {
        console.log(`   • ${user.email} - ${user.name} (${user.kelurahan?.nama || 'No kelurahan'})`);
    });
}

verifyLpsUsers()
    .catch((e) => {
        console.error('❌ Verification failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
