import { google } from 'googleapis';
import { createEvent } from 'ics';
import { format, parseISO, addHours } from 'date-fns';

type BookingDetails = {
    id: string;
    name: string;
    email: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    guests: string;
    branch: string;
    phone: string;
};

const createTransporter = async () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                console.error("Failed to create access token :(", err);
                reject("Failed to create access token");
            }
            resolve(token);
        });
    });

    return oauth2Client;
};

export async function sendBookingEmail(booking: BookingDetails) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
        console.warn("Gmail API creds missing. Skipping email sending.");
        return;
    }

    try {
        const auth = await createTransporter();
        const gmail = google.gmail({ version: 'v1', auth });

        const startDateTime = parseISO(`${booking.date}T${booking.time}`);

        // Generate ICS
        const event = {
            start: [
                startDateTime.getFullYear(),
                startDateTime.getMonth() + 1,
                startDateTime.getDate(),
                startDateTime.getHours(),
                startDateTime.getMinutes()
            ] as [number, number, number, number, number],
            duration: { hours: 2, minutes: 0 },
            title: `Dinner Reservation at ThaanFai (${booking.branch})`,
            description: `Reservation for ${booking.guests} people.\nName: ${booking.name}\nPhone: ${booking.phone}`,
            location: booking.branch === 'rama9' ? 'ThaanFai Rama 9' : 'ThaanFai Liabduan',
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: 'ThaanFai Admin', email: process.env.GMAIL_SENDER_EMAIL || 'admin@thaanfai.com' },
            attendees: [
                { name: booking.name, email: booking.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
            ]
        };

        let icsContent = '';
        // @ts-ignore
        createEvent(event, (error, value) => {
            if (!error) icsContent = value;
        });

        // Construct Raw Email
        const subject = 'Reservation Confirmed - ThaanFai';
        const sender = process.env.GMAIL_SENDER_EMAIL || "reservations@thaanfai.com";
        const to = booking.email;

        const cancellationLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/bookings/${booking.id}/cancel`;

        const htmlBody = `
            <div style="font-family: sans-serif; max-w-600px; margin: 0 auto; color: #333;">
                <h1 style="color: #d4a373;">Reservation Confirmed</h1>
                <p>Dear ${booking.name},</p>
                <p>We look forward to welcoming you to <strong>ThaanFai ${booking.branch}</strong>.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${format(startDateTime, 'PPP')}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.time}</p>
                    <p style="margin: 5px 0;"><strong>Guests:</strong> ${booking.guests}</p>
                </div>
                <p>A calendar invite has been attached to this email.</p>
                 <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                    Need to cancel? <a href="${cancellationLink}" style="color: #e63946;">Click here to cancel reservation</a>
                </p>
            </div>
        `;

        // MIME Construction
        const boundary = "__MIME_BOUNDARY__";
        const nl = "\n";

        let raw = [
            `To: ${to}`,
            `Subject: ${subject}`,
            `From: ThaanFai Reservations <${sender}>`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset="UTF-8"`,
            `Content-Transfer-Encoding: 7bit`,
            ``,
            htmlBody,
            ``,
            `--${boundary}`,
            `Content-Type: text/calendar; charset="UTF-8"; method=REQUEST`,
            `Content-Transfer-Encoding: base64`,
            `Content-Disposition: attachment; filename="reservation.ics"`,
            ``,
            Buffer.from(icsContent).toString('base64'),
            ``,
            `--${boundary}--`
        ].join(nl);

        const encodedMessage = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        console.log(`Email sent to ${booking.email} via Gmail API`);

    } catch (error) {
        console.error("Error sending email via Gmail API:", error);
    }
}
