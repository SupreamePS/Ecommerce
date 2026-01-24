
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting Schema Migration V5...");

        // 1. Drop is_available from tables
        await client.query('ALTER TABLE tables DROP COLUMN IF EXISTS is_available');
        // Note: IF EXISTS syntax for column drop varies, usually just DROP COLUMN. 
        // Safer: Check if exists or just try/catch.
        // Postgres: ALTER TABLE table_name DROP COLUMN [IF EXISTS] column_name

        try {
            await client.query('ALTER TABLE tables DROP COLUMN IF EXISTS is_available');
            console.log("Dropped 'is_available' from tables.");
        } catch (e) {
            console.log("Column is_available might not exist or error:", e.message);
        }

        // 2. Add end_time to bookings
        // We use VARCHAR(5) for 'HH:MM' to match existing 'time' column convention.
        await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time VARCHAR(5)');
        console.log("Added 'end_time' to bookings.");

        // 3. Backfill end_time for existing bookings
        // Default: time + 1 hour.

        // Fetch all bookings valid
        const res = await client.query('SELECT id, time FROM bookings WHERE end_time IS NULL');
        for (const row of res.rows) {
            if (row.time && row.time.includes(':')) {
                const [h, m] = row.time.split(':').map(Number);
                let endH = h + 1;
                let endM = m;
                if (endH >= 24) endH = 23; // Clamp for now or cycle. Restaurant closes.
                // Format HH:MM
                const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                await client.query('UPDATE bookings SET end_time = $1 WHERE id = $2', [endStr, row.id]);
            }
        }
        console.log(`Backfilled end_time for ${res.rowCount} bookings.`);

        console.log("Migration V5 Complete.");

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
