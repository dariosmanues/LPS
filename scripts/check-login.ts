
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkLogin() {
    const email = 'ketua.binawidya@lps.pekanbaru.go.id';
    const password = 'lps123';

    console.log(`Checking login for: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('❌ User NOT found in database.');
        return;
    }

    console.log('✅ User found.');
    console.log('Stored Hash:', user.passwordHash);

    const match = await bcrypt.compare(password, user.passwordHash);

    if (match) {
        console.log('✅ Password VALID.');
    } else {
        console.log('❌ Password INVALID.');
    }
}

checkLogin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
