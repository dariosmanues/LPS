import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Handle SQLite on Vercel serverless environment
if (process.env.VERCEL) {
    const possiblePaths = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), '.next', 'server', 'prisma', 'dev.db'),
    ];

    const tmpDbPath = '/tmp/dev.db';

    if (!fs.existsSync(tmpDbPath)) {
        for (const dbPath of possiblePaths) {
            if (fs.existsSync(dbPath)) {
                try {
                    fs.copyFileSync(dbPath, tmpDbPath);
                    console.log('Successfully copied SQLite db from', dbPath, 'to /tmp/dev.db');
                    break;
                } catch (e) {
                    console.error('Failed to copy db to /tmp from', dbPath, ':', e);
                }
            }
        }
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

