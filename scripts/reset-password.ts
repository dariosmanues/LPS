
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'ketua.binawidya@lps.pekanbaru.go.id';
    const newPassword = 'lps123';

    console.log(`Resetting password for ${email}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: {
            passwordHash: hashedPassword
        }
    });

    console.log(`✅ Password for ${user.email} has been reset to: ${newPassword}`);

    // Verify immediate compare
    const isMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`Self-check match: ${isMatch}`);
}

resetPassword()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
