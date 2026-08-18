const { execSync } = require('child_process');

console.log('[*] Starting build process...');

try {
  // Generate Prisma Client and build Next.js application
  // Seeding is removed from production build to prevent data loss/reset
  execSync('npx prisma generate && npx next build', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('[!] Build failed:', error);
  process.exit(1);
}
