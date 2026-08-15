const { execSync } = require('child_process');

// Ensure DATABASE_URL is valid for SQLite (must start with file:)
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

console.log('[*] Postinstall using DATABASE_URL:', process.env.DATABASE_URL);

try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.warn('[!] Postinstall prisma generate warning:', error.message);
}
