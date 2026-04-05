import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedLpsUsers() {
    console.log('🌱 Starting LPS user seed for ALL kelurahan...');

    // Get ALL kelurahan from the database
    const kelurahanList = await prisma.kelurahan.findMany({
        include: { kecamatan: true },
        orderBy: { nama: 'asc' }
    });

    if (kelurahanList.length === 0) {
        console.log('❌ No kelurahan found. Please run the main seed first.');
        return;
    }

    console.log(`📊 Found ${kelurahanList.length} kelurahan`);
    console.log(`📝 Will create ${kelurahanList.length * 3} users (3 per kelurahan)\n`);

    const hashedPassword = await bcrypt.hash('lps123', 10);
    let createdCount = 0;
    let skippedCount = 0;

    for (const kelurahan of kelurahanList) {
        const baseName = kelurahan.nama.toLowerCase().replace(/\s+/g, '');

        console.log(`\n📍 Processing ${kelurahan.nama}, Kecamatan: ${kelurahan.kecamatan.nama}`);

        // Create Ketua LPS
        try {
            const ketua = await prisma.user.upsert({
                where: { email: `ketua.${baseName}@lps.pekanbaru.go.id` },
                update: {},
                create: {
                    email: `ketua.${baseName}@lps.pekanbaru.go.id`,
                    passwordHash: hashedPassword,
                    name: `Ketua LPS ${kelurahan.nama}`,
                    role: 'LPS_KETUA',
                    kelurahanId: kelurahan.id
                }
            });
            console.log(`  ✅ LPS_KETUA: ${ketua.email}`);
            createdCount++;
        } catch (error) {
            console.log(`  ⚠️  LPS_KETUA: Already exists`);
            skippedCount++;
        }

        // Create Sekretaris LPS
        try {
            const sekretaris = await prisma.user.upsert({
                where: { email: `sekretaris.${baseName}@lps.pekanbaru.go.id` },
                update: {},
                create: {
                    email: `sekretaris.${baseName}@lps.pekanbaru.go.id`,
                    passwordHash: hashedPassword,
                    name: `Sekretaris LPS ${kelurahan.nama}`,
                    role: 'LPS_SEKRETARIS',
                    kelurahanId: kelurahan.id
                }
            });
            console.log(`  ✅ LPS_SEKRETARIS: ${sekretaris.email}`);
            createdCount++;
        } catch (error) {
            console.log(`  ⚠️  LPS_SEKRETARIS: Already exists`);
            skippedCount++;
        }

        // Create Bendahara LPS
        try {
            const bendahara = await prisma.user.upsert({
                where: { email: `bendahara.${baseName}@lps.pekanbaru.go.id` },
                update: {},
                create: {
                    email: `bendahara.${baseName}@lps.pekanbaru.go.id`,
                    passwordHash: hashedPassword,
                    name: `Bendahara LPS ${kelurahan.nama}`,
                    role: 'LPS_BENDAHARA',
                    kelurahanId: kelurahan.id
                }
            });
            console.log(`  ✅ LPS_BENDAHARA: ${bendahara.email}`);
            createdCount++;
        } catch (error) {
            console.log(`  ⚠️  LPS_BENDAHARA: Already exists`);
            skippedCount++;
        }
    }

    // Count total LPS users in database
    const totalLpsUsers = await prisma.user.count({
        where: {
            role: {
                in: ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA']
            }
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 LPS user seed completed!');
    console.log('='.repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   • Kelurahan processed: ${kelurahanList.length}`);
    console.log(`   • Users created: ${createdCount}`);
    console.log(`   • Users skipped (already exist): ${skippedCount}`);
    console.log(`   • Total LPS users in database: ${totalLpsUsers}`);
    console.log('='.repeat(60));
    console.log('\n📌 Sample credentials:');
    console.log('   Email: ketua.binawidya@lps.pekanbaru.go.id');
    console.log('   Password: lps123');
    console.log('\n💡 Tip: All users have the same password: lps123');
}

seedLpsUsers()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
