
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { addHours, parseISO, isBefore, isAfter, format } from 'date-fns';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const branchIdStr = searchParams.get('branch_id'); // Changed from branch name
    const guestsStr = searchParams.get('guests');

    console.log('[Availability API] Request received:', { date, branch_id: branchIdStr, guests: guestsStr });

    if (!date || !branchIdStr || !guestsStr) {
        console.log('[Availability API] ❌ Missing parameters');
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const branchId = parseInt(branchIdStr);
    const guests = parseInt(guestsStr);

    try {
        const client = await pool.connect();
        try {
            // 1. Get all tables for the branch
            const tablesRes = await client.query(
                'SELECT * FROM tables WHERE branch_id = $1 ORDER BY capacity_min ASC',
                [branchId]
            );
            const tables = tablesRes.rows;
            console.log(`[Availability API] Found ${tables.length} tables for branch ${branchId}`);

            // 2. Get all bookings for the date
            // We need to check exact overlaps.
            const bookingsRes = await client.query(
                'SELECT * FROM bookings WHERE branch_id = $1 AND date = $2 AND status != $3',
                [branchId, date, 'cancelled']
            );
            const bookings = bookingsRes.rows;
            console.log(`[Availability API] Found ${bookings.length} bookings for date ${date}:`,
                bookings.map(b => ({ time: b.time, table: b.table_number, guests: b.guests })));

            // 3. Define time slots
            const timeSlots = [
                "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00",
                "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
            ];

            // Dining Duration is 2 hour
            const DINING_DURATION_HOURS = 2;

            const availableSlots = timeSlots.filter(slotTime => {
                const requestedStart = parseISO(`${date}T${slotTime}`);
                const requestedEnd = addHours(requestedStart, DINING_DURATION_HOURS);
                // Find occupied table IDs
                const occupiedTableIds = new Set();

                let usedCapacity = 0;

                bookings.forEach(booking => {
                    const bStart = parseISO(`${booking.date}T${booking.time}`);
                    // Ensure backward compatibility or use new end_time column
                    // If end_time exists, use it. Else default to 1h.
                    let bEnd = addHours(bStart, DINING_DURATION_HOURS);
                    if (booking.end_time) {
                        // booking.end_time is HH:MM string
                        bEnd = parseISO(`${booking.date}T${booking.end_time}`);
                        // Handle edge case if end_time is next day? Assumed same day for now.
                    }

                    // Overlap Check: StartA < EndB && EndA > StartB
                    if (isBefore(requestedStart, bEnd) && isAfter(requestedEnd, bStart)) {
                        usedCapacity += parseInt(booking.guests);

                        // Also track specific tables if assigned
                        if (booking.table_number) {
                            const tNums = booking.table_number.toString().split(',').map((s: string) => s.trim());
                            tNums.forEach((t: string) => occupiedTableIds.add(t));
                        }
                    }
                });
                // console.log(`[Availability API] Used capacity for ${guests} guests:`, usedCapacity);
                // Capacity Logic:
                // 1. Check total remaining capacity (Heuristic)
                // 2. Check if there is AT LEAST one table that is NOT in occupiedTableIds 
                //    AND fits the guest count.

                // Filter tables that are NOT occupied
                const freeTables = tables.filter(t => !occupiedTableIds.has(t.table_number.toString()));
                // console.log(`[Availability API] Free tables for ${guests} guests:`, freeTables);
                const totalFreeCapacity = freeTables.reduce((sum, t) => sum + t.capacity_max, 0);
                // console.log(`[Availability API] Slot ${slotTime} total free capacity: ${totalFreeCapacity} for ${guests} guests`);
                return totalFreeCapacity >= guests;
            });

            console.log(`[Availability API] ✅ Available slots for ${guests} guests:`, availableSlots);
            return NextResponse.json({ availableSlots });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Availability check failed:', error);
        return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
    }
}
