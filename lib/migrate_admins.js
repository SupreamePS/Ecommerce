const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');

        // 1. Create admins table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Admins table created or already exists.');

        // 2. Seed initial admin user
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD not found in .env');
            return;
        }

        // Check if admin already exists
        const checkRes = await client.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
        if (checkRes.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await client.query(
                'INSERT INTO admins (email, password) VALUES ($1, $2)',
                [adminEmail, hashedPassword]
            );
            console.log(`✅ Admin user seeded: ${adminEmail}`);
        } else {
            console.log('ℹ️ Admin user already exists. Skipping seed.');
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
