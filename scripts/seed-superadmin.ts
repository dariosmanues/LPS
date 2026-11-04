import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('--- Seeding Super Admin & Viewer Users ---');

    // 1. Super Admin (Full Access on every menu)
    const superAdminPasswordHash = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@lps.pekanbaru.go.id' },
        update: {
            name: 'Nisa',
            role: 'SUPERADMIN',
            passwordHash: superAdminPasswordHash,
        },
        create: {
            email: 'superadmin@lps.pekanbaru.go.id',
            name: 'Nisa',
            role: 'SUPERADMIN',
            passwordHash: superAdminPasswordHash,
        },
    });
    console.log('✅ Super Admin ready:', {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
    });

    // 2. Read-Only Viewer (for testing read-only access)
    const viewerPasswordHash = await bcrypt.hash('viewer123', 10);
    const viewer = await prisma.user.upsert({
        where: { email: 'viewer@lps.pekanbaru.go.id' },
        update: {
            name: 'Petugas Monitoring (Read-Only)',
            role: 'VIEWER',
            passwordHash: viewerPasswordHash,
        },
        create: {
            email: 'viewer@lps.pekanbaru.go.id',
            name: 'Petugas Monitoring (Read-Only)',
            role: 'VIEWER',
            passwordHash: viewerPasswordHash,
        },
    });
    console.log('✅ Read-Only Viewer ready:', {
        id: viewer.id,
        email: viewer.email,
        name: viewer.name,
        role: viewer.role,
    });
}

main()
    .catch((e) => {
        console.error('Error seeding users:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

