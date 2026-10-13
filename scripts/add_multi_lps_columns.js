const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function migrate() {
    console.log('Checking and adding columns to armada table in LPS DB...');
    await p.$executeRawUnsafe('ALTER TABLE armada ADD COLUMN IF NOT EXISTS is_multi_lps_verified BOOLEAN DEFAULT FALSE;');
    await p.$executeRawUnsafe('ALTER TABLE armada ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;');
    await p.$executeRawUnsafe('ALTER TABLE armada ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255);');
    
    const cols = await p.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'armada' ORDER BY ordinal_position;");
    console.log('Current armada columns:');
    console.table(cols);
    console.log('Columns verified successfully!');
}

migrate()
    .catch((err) => {
        console.error('Migration error:', err);
        process.exit(1);
    })
    .finally(() => {
        p.$disconnect();
    });
