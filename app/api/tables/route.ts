
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    console.log('[Tables API] GET request:', { branch });

    try {
        const client = await pool.connect();
        try {
            let query = 'SELECT * FROM tables';
            const values = [];

            if (branch) {
                // If branch param is numeric, assume ID. Otherwise ignore?
                // Frontend will send ID now.
                const branchId = parseInt(branch);
                if (!isNaN(branchId)) {
                    query += ' WHERE branch_id = $1';
                    values.push(branchId);
                }
            }

            query += ' ORDER BY table_number ASC';

            const result = await client.query(query, values);
            console.log(`[Tables API] ✅ Retrieved ${result.rows.length} tables`);
            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching tables:', error);
        return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
    }
}
