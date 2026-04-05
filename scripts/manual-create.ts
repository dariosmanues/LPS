
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createManualUser() {
    const email = 'ketua.binawidya@lps.pekanbaru.go.id';
    const password = 'lps123';

    // Use findFirst to avoid unique constraint requirements in findUnique if nama isn't labeled unique in schema
    const kelurahan = await prisma.kelurahan.findFirst({
        where: { nama: 'Binawidya' }
    });

    if (!kelurahan) {
        console.log('Kelurahan Binawidya not found!');
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            kelurahanId: kelurahan.id,
            role: 'LPS_KETUA'
        },
        create: {
            email,
            passwordHash: hashedPassword,
            name: 'Ketua LPS Binawidya (Manual)',
            role: 'LPS_KETUA',
            kelurahanId: kelurahan.id
        }
    });

    console.log(`✅ User UPSERTED: ${user.email}`);

    // VERIFY
    const checkUser = await prisma.user.findUnique({ where: { email } });
    console.log(`🔍 Check User: ${checkUser?.email}`);
    const checkPass = await bcrypt.compare(password, checkUser?.passwordHash || '');
    console.log(`🔐 Password Match: ${checkPass}`);
}

createManualUser()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
