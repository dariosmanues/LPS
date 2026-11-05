const { execSync } = require('child_process');

console.log('[*] Running postinstall (prisma generate)...');

try {
  execSync('npx --yes prisma@^6.0.0 generate', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.warn('[!] Postinstall prisma generate warning:', error.message);
}
