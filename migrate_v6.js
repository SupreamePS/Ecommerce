
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting Schema Migration V6...");

        // 1. Create branches table
        await client.query(`
            CREATE TABLE IF NOT EXISTS branches (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                address TEXT
            );
        `);
        console.log("Created 'branches' table.");

        // 2. Seed Branches
        // Upsert to avoid dupes
        const branches = [
            { name: 'rama9', address: 'Rama 9, Bangkok' },
            { name: 'liabduan', address: 'Liabduan, Bangkok' }
        ];

        for (const b of branches) {
            await client.query(`
                INSERT INTO branches (name, address) VALUES ($1, $2)
                ON CONFLICT (name) DO NOTHING
            `, [b.name, b.address]);
        }
        console.log("Seeded branches.");

        // 3. Add branch_id to tables and bookings
        await client.query('ALTER TABLE tables ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id)');
        await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id)');

        // 4. Backfill IDs based on name
        // Tables
        await client.query(`
            UPDATE tables 
            SET branch_id = branches.id 
            FROM branches 
            WHERE tables.branch = branches.name
        `);
        // Bookings
        await client.query(`
            UPDATE bookings 
            SET branch_id = branches.id 
            FROM branches 
            WHERE bookings.branch = branches.name
        `);
        console.log("Backfilled branch_id.");

        // 5. Drop old columns (Optional but cleaner. User asked to 'refer to branch_id instead')
        // We will drop to enforce usage.
        await client.query('ALTER TABLE tables DROP COLUMN IF EXISTS branch');
        await client.query('ALTER TABLE bookings DROP COLUMN IF EXISTS branch');

        console.log("Dropped old 'branch' string columns.");
        console.log("Migration V6 Complete.");

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
