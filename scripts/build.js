const { execSync } = require('child_process');

// Ensure DATABASE_URL is valid for SQLite (must start with file:)
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

console.log('[*] Build step using DATABASE_URL:', process.env.DATABASE_URL);

try {
  execSync('npx prisma generate && npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts && npx next build', {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('[!] Build failed:', error);
  process.exit(1);
}
