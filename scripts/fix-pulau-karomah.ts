import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('=== FIX PULAU KAROMAH ===');

    // 1. Find the Kelurahan
    let kelurahan = await prisma.kelurahan.findFirst({
        where: {
            OR: [
                { id: '8fbba8a7-b3a9-4f9e-97fa-4b92bee2a3f5' },
                { nama: 'Pulau Karam' },
                { nama: 'Pulau Karomah' }
            ]
        }
    });

    if (!kelurahan) {
        console.error('❌ Kelurahan not found!');
        return;
    }

    console.log(`Current Kelurahan: "${kelurahan.nama}" (ID: ${kelurahan.id})`);

    // Update Kelurahan name to Pulau Karomah if needed
    if (kelurahan.nama !== 'Pulau Karomah') {
        kelurahan = await prisma.kelurahan.update({
            where: { id: kelurahan.id },
            data: { nama: 'Pulau Karomah' }
        });
        console.log(`✅ Updated Kelurahan name to: "${kelurahan.nama}"`);
    }

    // 2. Link Armada
    const armadas = await prisma.armada.findMany({
        where: {
            OR: [
                { namaLps: { contains: 'Pulau Karomah', mode: 'insensitive' } },
                { namaLps: { contains: 'Pulau Karam', mode: 'insensitive' } },
                { platNomor: 'BM 4603 ACA' }
            ]
        }
    });

    console.log(`Found ${armadas.length} Armada(s):`);
    for (const a of armadas) {
        const updated = await prisma.armada.update({
            where: { id: a.id },
            data: { kelurahanId: kelurahan.id }
        });
        console.log(`  ✅ Linked Armada [${updated.platNomor} - ${updated.namaLps}] to Kelurahan ${kelurahan.nama}`);
    }

    // 3. Setup Users with password 'lps123'
    const hashedPassword = await bcrypt.hash('lps123', 10);

    const usersToEnsure = [
        {
            email: 'ketua.pulaukaromah@lps.pekanbaru.go.id',
            name: 'Ketua LPS Pulau Karomah',
            role: 'LPS_KETUA'
        },
        {
            email: 'sekretaris.pulaukaromah@lps.pekanbaru.go.id',
            name: 'Sekretaris LPS Pulau Karomah',
            role: 'LPS_SEKRETARIS'
        },
        {
            email: 'bendahara.pulaukaromah@lps.pekanbaru.go.id',
            name: 'Bendahara LPS Pulau Karomah',
            role: 'LPS_BENDAHARA'
        },
        {
            email: 'ketua.pulau-karomah@lps.pekanbaru.go.id',
            name: 'Ketua LPS Pulau Karomah',
            role: 'LPS_KETUA'
        },
        // Also ensure legacy/fallback emails work
        {
            email: 'ketua.pulaukaram@lps.pekanbaru.go.id',
            name: 'Ketua LPS Pulau Karomah (Legacy)',
            role: 'LPS_KETUA'
        },
        {
            email: 'sekretaris.pulaukaram@lps.pekanbaru.go.id',
            name: 'Sekretaris LPS Pulau Karomah (Legacy)',
            role: 'LPS_SEKRETARIS'
        },
        {
            email: 'bendahara.pulaukaram@lps.pekanbaru.go.id',
            name: 'Bendahara LPS Pulau Karomah (Legacy)',
            role: 'LPS_BENDAHARA'
        }
    ];

    for (const u of usersToEnsure) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                passwordHash: hashedPassword,
                name: u.name,
                role: u.role,
                kelurahanId: kelurahan.id
            },
            create: {
                email: u.email,
                passwordHash: hashedPassword,
                name: u.name,
                role: u.role,
                kelurahanId: kelurahan.id
            }
        });
        console.log(`  ✅ User ready: ${user.email} (${user.role}) - password: 'lps123'`);
    }

    // 4. Verify login
    const testUser = await prisma.user.findUnique({
        where: { email: 'ketua.pulaukaromah@lps.pekanbaru.go.id' }
    });
    if (testUser) {
        const isValid = await bcrypt.compare('lps123', testUser.passwordHash);
        console.log(`\nVerification login for ${testUser.email} with 'lps123': ${isValid ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    }

    console.log('\n🎉 Fix completed successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
