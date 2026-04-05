import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
    try {
        console.log('🔍 Verifying Armada Import...\n');

        // Count total armada
        const totalArmada = await prisma.armada.count();
        console.log(`📊 Total Armada records: ${totalArmada}`);

        // Count armada with kelurahan
        const armadaWithKelurahan = await prisma.armada.count({
            where: { kelurahanId: { not: null } }
        });
        console.log(`🗺️  Armada with Kelurahan: ${armadaWithKelurahan}`);
        console.log(`⚠️  Armada without Kelurahan: ${totalArmada - armadaWithKelurahan}\n`);

        // Get sample data with relations
        const sampleArmada = await prisma.armada.findMany({
            take: 5,
            include: {
                kelurahan: {
                    include: { kecamatan: true }
                }
            }
        });

        console.log('📋 Sample Armada Records:\n');
        sampleArmada.forEach((armada, idx) => {
            console.log(`${idx + 1}. ${armada.namaLps}`);
            console.log(`   Plate: ${armada.platNomor}`);
            console.log(`   Chairman: ${armada.namaKetuaLps || 'N/A'}`);
            console.log(`   Permit: ${armada.noIzinOperasi || 'N/A'}`);
            console.log(`   QR: ${armada.qrCode}`);
            if (armada.kelurahan) {
                console.log(`   Location: ${armada.kelurahan.nama}, ${armada.kelurahan.kecamatan.nama}`);
            } else {
                console.log(`   Location: Not assigned`);
            }
            console.log('');
        });

        // Group by kelurahan
        const armadaByKelurahan = await prisma.armada.groupBy({
            by: ['kelurahanId'],
            _count: true,
            where: { kelurahanId: { not: null } }
        });

        console.log(`\n📊 Armada Distribution by Kelurahan (${armadaByKelurahan.length} kelurahan):`);

        for (const group of armadaByKelurahan.slice(0, 10)) {
            if (group.kelurahanId) {
                const kelurahan = await prisma.kelurahan.findUnique({
                    where: { id: group.kelurahanId },
                    include: { kecamatan: true }
                });
                if (kelurahan) {
                    console.log(`   ${kelurahan.nama} (${kelurahan.kecamatan.nama}): ${group._count} armada`);
                }
            }
        }

        if (armadaByKelurahan.length > 10) {
            console.log(`   ... and ${armadaByKelurahan.length - 10} more kelurahan`);
        }

        console.log('\n✅ Verification complete!');

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyImport();
