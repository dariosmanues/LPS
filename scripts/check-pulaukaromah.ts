import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Kelurahan with "pulau" or "karomah" ---');
    const kelurahans = await prisma.kelurahan.findMany({
        where: {
            OR: [
                { nama: { contains: 'pulau', mode: 'insensitive' } },
                { nama: { contains: 'karomah', mode: 'insensitive' } },
            ]
        },
        include: {
            users: true,
            kecamatan: true
        }
    });
    console.log('Kelurahans found:', JSON.stringify(kelurahans, null, 2));

    console.log('--- Checking Armada with "pulau" or "karomah" ---');
    const armadas = await prisma.armada.findMany({
        where: {
            OR: [
                { namaLps: { contains: 'pulau', mode: 'insensitive' } },
                { namaLps: { contains: 'karomah', mode: 'insensitive' } },
            ]
        }
    });
    console.log('Armadas found:', JSON.stringify(armadas, null, 2));

    console.log('--- Checking Users with "pulau" or "karomah" ---');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: 'pulau', mode: 'insensitive' } },
                { email: { contains: 'karomah', mode: 'insensitive' } },
                { name: { contains: 'pulau', mode: 'insensitive' } },
                { name: { contains: 'karomah', mode: 'insensitive' } },
            ]
        },
        include: {
            kelurahan: true
        }
    });
    console.log('Users found:', JSON.stringify(users, null, 2));

    // Check if ketua.pulaukaromah exists
    const exactUser = await prisma.user.findUnique({
        where: { email: 'ketua.pulaukaromah@lps.pekanbaru.go.id' }
    });
    console.log('Exact user ketua.pulaukaromah:', exactUser);

    if (exactUser) {
        const testPasswords = ['lps123', 'lps12345', 'password', 'pulaukaromah', '123456', 'admin123', 'admin', 'pekanbaru', 'pekanbaru123'];
        for (const pwd of testPasswords) {
            const match = await bcrypt.compare(pwd, exactUser.passwordHash);
            if (match) {
                console.log(`Password matches: "${pwd}"`);
            }
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
