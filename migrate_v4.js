
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting Schema Migration V4...");

        // 1. Drop existing tables table (Re-create for clean state)
        await client.query('DROP TABLE IF EXISTS tables');

        // 2. Create tables table with Boolean Status
        await client.query(`
            CREATE TABLE IF NOT EXISTS tables (
                id SERIAL PRIMARY KEY,
                branch VARCHAR(50) NOT NULL,
                table_number INT NOT NULL,
                capacity_min INT NOT NULL,
                capacity_max INT NOT NULL,
                is_available BOOLEAN DEFAULT true NOT NULL,
                UNIQUE (branch, table_number)
            );
        `);
        console.log("Created 'tables' table with is_available (BOOLEAN).");

        // 3. Seed Data
        // Same count as before
        const rama9Tables = [];
        let r_counter = 1;
        for (let i = 0; i < 4; i++) rama9Tables.push({ b: 'rama9', n: r_counter++, min: 6, max: 8 });
        for (let i = 0; i < 5; i++) rama9Tables.push({ b: 'rama9', n: r_counter++, min: 1, max: 4 });
        for (let i = 0; i < 3; i++) rama9Tables.push({ b: 'rama9', n: r_counter++, min: 1, max: 2 });

        const liabduanTables = [];
        let l_counter = 1;
        for (let i = 0; i < 2; i++) liabduanTables.push({ b: 'liabduan', n: l_counter++, min: 1, max: 6 });
        for (let i = 0; i < 7; i++) liabduanTables.push({ b: 'liabduan', n: l_counter++, min: 1, max: 4 });
        for (let i = 0; i < 2; i++) liabduanTables.push({ b: 'liabduan', n: l_counter++, min: 1, max: 2 });

        const allTables = [...rama9Tables, ...liabduanTables];

        for (const t of allTables) {
            await client.query(`
                INSERT INTO tables (branch, table_number, capacity_min, capacity_max, is_available)
                VALUES ($1, $2, $3, $4, true)
            `, [t.b, t.n, t.min, t.max]);
        }

        console.log(`Seeded ${allTables.length} tables.`);
        console.log("Migration V4 Complete.");

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
