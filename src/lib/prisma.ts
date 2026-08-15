import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Handle SQLite on Vercel serverless environment
if (process.env.VERCEL) {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const tmpDbPath = '/tmp/dev.db';

    if (!fs.existsSync(tmpDbPath)) {
        try {
            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, tmpDbPath);
            }
        } catch (e) {
            console.error('Failed to copy db to /tmp:', e);
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

