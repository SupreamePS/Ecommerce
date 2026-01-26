import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        const client = await pool.connect();
        try {
            const res = await client.query('SELECT * FROM admins WHERE email = $1', [email]);

            if (res.rows.length === 0) {
                return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
            }

            const admin = res.rows[0];
            const isPasswordMatch = await bcrypt.compare(password, admin.password);

            if (isPasswordMatch) {
                // In a real app, we would use a proper session/JWT here.
                // For now, we'll return success and the client will use sessionStorage.
                return NextResponse.json({ success: true, message: 'Logged in successfully' });
            } else {
                return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, message: 'An error occurred during login' }, { status: 500 });
    }
}
