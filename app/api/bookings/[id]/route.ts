
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Destructure possible fields
        const { table_number, status, time, end_time, guests, date } = body;

        if (date) {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                return NextResponse.json({ error: 'Cannot book in the past' }, { status: 400 });
            }

            if (selectedDate.getDay() === 1) { // 1 is Monday
                return NextResponse.json({ error: 'Restaurant is closed on Mondays' }, { status: 400 });
            }
        }

        console.log(`[Bookings API] PATCH /${id} - Update request:`, { table_number, status, time, end_time, guests, date });

        const client = await pool.connect();
        try {
            // We don't need transaction for single table update anymore since we dropped is_available.

            // Logic for Time/End Time
            let finalTime = time;
            let finalEndTime = end_time;

            // If time is updated but end_time is not provided, Recalculate End Time (Default 1h)
            if (time && !end_time) {
                const [h, m] = time.split(':').map(Number);
                let endH = h + 1;
                let endM = m;
                if (endH >= 24) endH = 23;
                finalEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
            }

            // If end_time is provided (e.g. Finish Booking), use it.

            // Construct dynamic update query
            // Simplest is to just update all provided fields or use COALESCE if strictly needed,
            // but effectively we can build the set clause.
            // For brevity, let's fetch current to merge or just update what's passed?
            // "Update what is passed" is better.

            const updates = [];
            const values = [];
            let idx = 1;

            if (table_number !== undefined) {
                updates.push(`table_number = $${idx++}`);
                values.push(table_number || null);
                // If assigning table, ensure status confirmed?
                if (table_number && !status) {
                    updates.push(`status = $${idx++}`);
                    values.push('confirmed');
                }
            }
            if (status !== undefined) {
                updates.push(`status = $${idx++}`);
                values.push(status);
            }
            if (finalTime !== undefined) {
                updates.push(`time = $${idx++}`);
                values.push(finalTime);
            }
            if (finalEndTime !== undefined) {
                updates.push(`end_time = $${idx++}`);
                values.push(finalEndTime);
            }
            if (guests !== undefined) {
                updates.push(`guests = $${idx++}`);
                values.push(parseInt(guests));
            }
            if (date !== undefined) {
                updates.push(`date = $${idx++}`);
                values.push(date);
            }

            if (updates.length === 0) {
                return NextResponse.json({ message: 'No changes provided' });
            }

            values.push(id);
            const query = `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${idx}`;

            await client.query(query, values);

            console.log(`[Bookings API] ✅ Booking ${id} updated successfully`);
            return NextResponse.json({ message: 'Booking updated' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const client = await pool.connect();
        try {
            await client.query('DELETE FROM bookings WHERE id = $1', [id]);
            console.log(`[Bookings API] ✅ Booking ${id} deleted successfully`);
            return NextResponse.json({ message: 'Booking deleted' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }
}
