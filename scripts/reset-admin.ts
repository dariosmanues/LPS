import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
    const email = 'admin@lps.pekanbaru.go.id';
    const newPassword = 'admin123';

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        console.log(`❌ User ${email} not found in database!`);
        
        // List all users
        const allUsers = await prisma.user.findMany({
            select: { email: true, name: true, role: true }
        });
        console.log('\n📋 All users in database:');
        allUsers.forEach(u => console.log(`  - ${u.email} (${u.role}) - ${u.name}`));
        return;
    }

    console.log(`Found user: ${user.email} (${user.role})`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword }
    });

    // Verify
    const updated = await prisma.user.findUnique({ where: { email } });
    const isMatch = await bcrypt.compare(newPassword, updated!.passwordHash);
    console.log(`✅ Password reset to "${newPassword}" - Verify: ${isMatch}`);
}

resetAdmin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
