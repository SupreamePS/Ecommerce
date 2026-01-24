
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    console.log('[Branches API] GET request');
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM branches ORDER BY name ASC');
            console.log(`[Branches API] ✅ Retrieved ${result.rows.length} branches`);
            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching branches:', error);
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}
