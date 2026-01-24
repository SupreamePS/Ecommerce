
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting migration...");

        // 1. Create tables table
        await client.query(`
        CREATE TABLE IF NOT EXISTS tables (
          id SERIAL PRIMARY KEY,
          branch VARCHAR(50) NOT NULL,
          table_number VARCHAR(20) NOT NULL,
          capacity_min INT NOT NULL,
          capacity_max INT NOT NULL
        );
      `);

        // 2. Clear existing data
        await client.query('DELETE FROM tables');

        // 3. Seed Data
        // Rama 9: 4 (6-8 seaters), 5 (4 seaters), 3 (2 seaters)
        const rama9Tables = [
            ...Array(4).fill(null).map((_, i) => ({ branch: 'rama9', table_number: `R-L${i + 1}`, min: 6, max: 8 })),
            ...Array(5).fill(null).map((_, i) => ({ branch: 'rama9', table_number: `R-M${i + 1}`, min: 1, max: 4 })),
            ...Array(3).fill(null).map((_, i) => ({ branch: 'rama9', table_number: `R-S${i + 1}`, min: 1, max: 2 })),
        ];

        // Liabduan: 2 (6 seaters), 7 (4 seaters), 2 (2 seaters)
        const liabduanTables = [
            ...Array(2).fill(null).map((_, i) => ({ branch: 'liabduan', table_number: `L-L${i + 1}`, min: 1, max: 6 })),
            ...Array(7).fill(null).map((_, i) => ({ branch: 'liabduan', table_number: `L-M${i + 1}`, min: 1, max: 4 })),
            ...Array(2).fill(null).map((_, i) => ({ branch: 'liabduan', table_number: `L-S${i + 1}`, min: 1, max: 2 })),
        ];

        const allTables = [...rama9Tables, ...liabduanTables];

        for (const table of allTables) {
            await client.query(`
            INSERT INTO tables (branch, table_number, capacity_min, capacity_max)
            VALUES ($1, $2, $3, $4)
         `, [table.branch, table.table_number, table.min, table.max]);
        }

        console.log('Tables setup successfully');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
