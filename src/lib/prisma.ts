import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Handle SQLite on Vercel serverless environment
if (process.env.VERCEL) {
    const possiblePaths = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), '.next', 'server', 'prisma', 'dev.db'),
        path.join(process.cwd(), '.next', 'server', 'app', 'prisma', 'dev.db'),
        path.resolve('./prisma/dev.db'),
        path.resolve('./dev.db'),
    ];

    const tmpDbPath = '/tmp/dev.db';

    let copied = false;
    for (const dbPath of possiblePaths) {
        if (fs.existsSync(dbPath)) {
            try {
                if (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0) {
                    fs.copyFileSync(dbPath, tmpDbPath);
                    console.log('Successfully copied SQLite db from', dbPath, 'to /tmp/dev.db');
                }
                copied = true;
                break;
            } catch (e) {
                console.error('Failed to copy db to /tmp from', dbPath, ':', e);
            }
        }
    }

    if (!copied && !fs.existsSync(tmpDbPath)) {
        console.warn('Could not find pre-built dev.db, database will be auto-seeded on first connection.');
    }

    process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-seed user accounts if database is empty (e.g. fresh SQLite on Vercel)
async function ensureDatabaseSeeded() {
    try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            console.log('[*] Auto-seeding users into empty SQLite database...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await prisma.user.createMany({
                data: [
                    {
                        email: 'admin@lps.pekanbaru.go.id',
                        passwordHash: hashedPassword,
                        name: 'Administrator',
                        role: 'ADMIN',
                    },
                    {
                        email: 'operator.hj@lps.com',
                        passwordHash: await bcrypt.hash('operator123', 10),
                        name: 'Operator Harapan Jaya',
                        role: 'OPERATOR',
                        transdepo: 'HARAPAN_JAYA',
                    },
                    {
                        email: 'operator.ah@lps.com',
                        passwordHash: await bcrypt.hash('operator123', 10),
                        name: 'Operator Air Hitam',
                        role: 'OPERATOR',
                        transdepo: 'AIR_HITAM',
                    },
                    {
                        email: 'gatekeeper@lps.pekanbaru.go.id',
                        passwordHash: await bcrypt.hash('gate123', 10),
                        name: 'Petugas TPA',
                        role: 'GATEKEEPER',
                    },
                ],
            });
            console.log('✅ Auto-seed completed successfully!');
        }
    } catch (e) {
        console.error('[!] Auto-seed error (table may need schema push):', e);
    }
}

ensureDatabaseSeeded();
