
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting Schema Migration V2...");

        // 1. Drop existing tables table (Need to recreate with new PK)
        // Warning: This deletes table data. 
        await client.query('DROP TABLE IF EXISTS tables');
        console.log("Dropped old 'tables' table.");

        // 2. Create tables table with Composite PK and Status
        await client.query(`
            CREATE TABLE IF NOT EXISTS tables (
                branch VARCHAR(50) NOT NULL,
                table_number INT NOT NULL,
                capacity_min INT NOT NULL,
                capacity_max INT NOT NULL,
                status VARCHAR(20) DEFAULT 'active' NOT NULL,
                PRIMARY KEY (branch, table_number)
            );
        `);
        console.log("Created 'tables' table with Composite PK.");

        // 3. Update bookings table to support integer table_number or just consistent type
        // The previous booking table_number was VARCHAR. We can keep it VARCHAR to be safe, 
        // or CAST to INT. Since users might have old "R-L1" data, changing to INT might fail/corrupt.
        // DECISION: Keep bookings.table_number as VARCHAR for now to support legacy data visualization,
        // BUT new bookings will store "1", "2" (stringified ints).
        // No schema change needed for bookings table_number itself if it stays VARCHAR.
        // However, we should ensure the column exists (it does from previous step).

        // 4. SEED DATA
        // Logic: 
        // Rama 9: 4 (6-8s), 5 (4s), 3 (2s) -> Total 12 tables.
        // Liabduan: 2 (6s), 7 (4s), 2 (2s) -> Total 11 tables.

        const rama9Tables = [];
        let r_counter = 1;
        // 4 x (6-8)
        for (let i = 0; i < 4; i++) rama9Tables.push({ b: 'rama9', n: r_counter++, min: 6, max: 8 });
        // 5 x (4)
        for (let i = 0; i < 5; i++) rama9Tables.push({ b: 'rama9', n: r_counter++, min: 1, max: 4 });
        // 3 x (2)
        for (let i = 0; i < 3; i++) rama9Tables.push({ b: 'rama9', n: r_counter++, min: 1, max: 2 });

        const liabduanTables = [];
        let l_counter = 1;
        // 2 x (6)
        for (let i = 0; i < 2; i++) liabduanTables.push({ b: 'liabduan', n: l_counter++, min: 1, max: 6 });
        // 7 x (4)
        for (let i = 0; i < 7; i++) liabduanTables.push({ b: 'liabduan', n: l_counter++, min: 1, max: 4 });
        // 2 x (2)
        for (let i = 0; i < 2; i++) liabduanTables.push({ b: 'liabduan', n: l_counter++, min: 1, max: 2 });

        const allTables = [...rama9Tables, ...liabduanTables];

        for (const t of allTables) {
            await client.query(`
                INSERT INTO tables (branch, table_number, capacity_min, capacity_max, status)
                VALUES ($1, $2, $3, $4, 'active')
            `, [t.b, t.n, t.min, t.max]);
        }

        console.log(`Seeded ${allTables.length} tables.`);
        console.log("Migration V2 Complete.");

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
