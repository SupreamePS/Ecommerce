
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting bookings table update...");

        // Add table_number column if it doesn't exist
        await client.query(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS table_number VARCHAR(50);
        `);

        console.log('Bookings table updated successfully');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
