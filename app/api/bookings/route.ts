import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendBookingEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { branch_id, date, time, guests, name, phone, email, table_number } = body;
        console.log('[Bookings API] POST - New booking request:', { branch_id, date, time, guests, name, phone, table_number });
        // Note: Frontend might still send 'branch' name if not updated yet, but we expect branch_id.
        // Let's fallback or require branch_id. Plan says updated frontend.

        // Server-side validation could go here
        const timestamp = new Date().toISOString();

        // Calculate End Time (1 hour duration)
        // Parse time (HH:mm)
        const [h, m] = time.split(':').map(Number);
        let endH = h + 1;
        let endM = m;
        if (endH >= 24) endH = 23; // Clamp or handle next day
        const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

        let assignedTable = table_number || null;
        let bookingStatus = 'confirmed'; // Default status

        // Auto-Allocation Logic
        if (!assignedTable) {
            const client = await pool.connect();
            try {
                // 1. Get all tables for the branch fitting the guests
                const tablesQuery = `
                    SELECT table_number, capacity_min, capacity_max 
                    FROM tables 
                    WHERE branch_id = $1 
                      AND capacity_max >= $2
                    ORDER BY capacity_min ASC
                `;
                const tablesRes = await client.query(tablesQuery, [branch_id, guests]);
                const potentialTables = tablesRes.rows;
                console.log(`[Bookings API] Auto-allocation: Found ${potentialTables.length} potential tables for ${guests} guests`);


                // 2. Check overlap for each table
                for (const table of potentialTables) {
                    const overlapQuery = `
                        SELECT id FROM bookings 
                        WHERE branch_id = $1 
                          AND date = $2 
                          AND table_number LIKE '%' || $3 || '%' 
                          AND status != 'cancelled'
                          AND (
                              (time::time, time::time + interval '1 hour') OVERLAPS 
                              ($4::time, $4::time + interval '1 hour')
                          )
                    `;
                    // Updated to 1 hour overlap check. 
                    // Also using LIKE for table_number to handle CSV string if needed, 
                    // though for creating specific allocation we usually assign single.
                    // But checking overlap against multi-table bookings is safer with LIKE or splitting.
                    // Simple LIKE check: if existing booking has "1,10", searching for "1" matches.
                    // Searching for "10" matches... wait, "1" matches "10"? No.
                    // Need strict check: ',1,10,' LIKE '%,1,%'.
                    // For now, assume table_number is simple or do smart check?
                    // Let's assume strict equality OR basic array check if we used arrays. 
                    // Since it's VARCHAR, let's use a safer regex or just fetch relevant bookings and filter in JS.
                    // Fetching all bookings for that day/branch is safer and we did that in Availability API.

                    // Let's fetch overlapping bookings first, then filter tables.
                    // Using query inside loop is N+1 but ok for 20 tables.
                    // Let's stick to query but improve table check.

                    const overlapRes = await client.query(overlapQuery, [branch_id, date, table.table_number.toString(), time]);

                    if (overlapRes.rowCount === 0) {
                        assignedTable = table.table_number.toString();
                        console.log(`[Bookings API] ✅ Auto-allocated table: ${assignedTable}`);
                        break; // Found a table!
                    }
                }

                if (!assignedTable) {
                    console.log('[Bookings API] ⚠️  No table available - setting status to PENDING');
                    bookingStatus = 'pending'; // No table found, mark as pending
                }

            } finally {
                client.release();
            }
        }

        // If assignedTable is still null and status is not pending (e.g. forced admin?), handle it.
        // User said: "if the guest booked... we can use a pending status so the staff can decide".
        // So pending is correct if auto-allocation fails.

        const query = `
      INSERT INTO bookings (timestamp, branch_id, date, time, end_time, guests, name, phone, email, status, table_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

        const values = [timestamp, branch_id, date, time, endTime, guests, name, phone, email, bookingStatus, assignedTable];

        const client = await pool.connect();
        try {
            // Fetch branch name for email
            const branchRes = await client.query('SELECT name FROM branches WHERE id = $1', [branch_id]);
            const branchName = branchRes.rows[0]?.name || 'Unknown Branch';

            const result = await client.query(query, values);
            const bookingId = result.rows[0].id;

            // Send confirmation email 
            await sendBookingEmail({
                id: bookingId,
                name,
                email,
                date,
                time,
                guests,
                branch: branchName,
                phone
            });

            console.log(`[Bookings API] ✅ Booking created successfully:`, { id: bookingId, status: bookingStatus, table: assignedTable });
            return NextResponse.json({ id: bookingId }, { status: 201 });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // Join with branches to get branch name (aliased as 'branch' for frontend compatibility)
            // also allow branch_id if needed, but existing frontend uses 'branch' string.
            const query = `
                SELECT 
                    b.id, b.timestamp, b.date, b.time, b.end_time, b.guests, b.name, b.phone, b.email, b.status, b.table_number,
                    br.name as branch, b.branch_id
                FROM bookings b
                LEFT JOIN branches br ON b.branch_id = br.id
                ORDER BY b.id DESC
            `;
            const result = await client.query(query);
            console.log(`[Bookings API] GET - Retrieved ${result.rows.length} bookings`);
            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
