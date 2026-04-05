import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPematangkapau() {
    console.log('🔧 Fixing missing users for Pematangkapau...\n');

    const kelurahan = await prisma.kelurahan.findFirst({
        where: { nama: 'Pematangkapau' }
    });

    if (!kelurahan) {
        console.log('❌ Kelurahan Pematangkapau not found!');
        return;
    }

    const hashedPassword = await bcrypt.hash('lps123', 10);
    const baseName = 'pematangkapau';

    try {
        // Create Ketua
        const ketua = await prisma.user.create({
            data: {
                email: `ketua.${baseName}@lps.pekanbaru.go.id`,
                passwordHash: hashedPassword,
                name: `Ketua LPS ${kelurahan.nama}`,
                role: 'LPS_KETUA',
                kelurahanId: kelurahan.id
            }
        });
        console.log(`✅ Created: ${ketua.email}`);

        // Create Sekretaris
        const sekretaris = await prisma.user.create({
            data: {
                email: `sekretaris.${baseName}@lps.pekanbaru.go.id`,
                passwordHash: hashedPassword,
                name: `Sekretaris LPS ${kelurahan.nama}`,
                role: 'LPS_SEKRETARIS',
                kelurahanId: kelurahan.id
            }
        });
        console.log(`✅ Created: ${sekretaris.email}`);

        // Create Bendahara
        const bendahara = await prisma.user.create({
            data: {
                email: `bendahara.${baseName}@lps.pekanbaru.go.id`,
                passwordHash: hashedPassword,
                name: `Bendahara LPS ${kelurahan.nama}`,
                role: 'LPS_BENDAHARA',
                kelurahanId: kelurahan.id
            }
        });
        console.log(`✅ Created: ${bendahara.email}`);

        console.log('\n🎉 Successfully created all 3 users for Pematangkapau!');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixPematangkapau().finally(() => prisma.$disconnect());
