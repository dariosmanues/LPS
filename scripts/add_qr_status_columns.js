const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function migrate() {
    console.log('Adding columns to armada table in LPS DB...');
    await p.$executeRawUnsafe('ALTER TABLE armada ADD COLUMN IF NOT EXISTS is_qr_used BOOLEAN DEFAULT FALSE;');
    await p.$executeRawUnsafe('ALTER TABLE armada ADD COLUMN IF NOT EXISTS qr_used_at TIMESTAMPTZ;');
    await p.$executeRawUnsafe('ALTER TABLE armada ADD COLUMN IF NOT EXISTS last_ticket_number VARCHAR(100);');
    console.log('Columns added successfully!');
}

migrate()
    .catch((err) => {
        console.error('Migration error:', err);
        process.exit(1);
    })
    .finally(() => {
        p.$disconnect();
    });
