import { Resend } from 'resend';

import { logger } from '../config/logger';

// If API key is missing, the service will silently skip sending (with a warning log)
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
// Use onboarding@resend.dev as `from` — this Resend-managed sender can deliver
// to ANY recipient without domain verification in test mode.
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export interface BookingEmailData {
  bookingCode: string;
  guestName: string;
  roomType: string;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  totalPrice: number | string;
  email: string;
}

export const sendBookingConfirmation = async (data: BookingEmailData) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Skipping booking confirmation email; RESEND_API_KEY is missing');
    return;
  }

  const checkIn = new Date(data.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const checkOut = new Date(data.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const price = Number(data.totalPrice).toLocaleString('id-ID');

  try {
    const response = await resend.emails.send({
      from: `Ron's Guesthouse <${fromEmail}>`,
      to: data.email,
      subject: `Konfirmasi Pemesanan - ${data.bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #b91c1c;">Booking Berhasil!</h2>
          <p>Halo <b>${data.guestName}</b>,</p>
          <p>Terima kasih telah memilih Ron's Guesthouse. Berikut adalah detail pemesanan kamar Anda. Harap segera melakukan pembayaran jika Anda belum menyelesaikannya.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Kode Booking</p>
            <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #991b1b;">${data.bookingCode}</p>
            
            <table style="width: 100%; text-align: left; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Kamar</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${data.roomType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Check-in</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${checkIn}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Check-out</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${checkOut}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0 0;">Total Pembayaran</td>
                <td style="padding: 12px 0 0 0; font-weight: bold; color: #b91c1c;">Rp ${price}</td>
              </tr>
            </table>
          </div>

          <p>Anda dapat menggunakan <b>Kode Booking</b> dan alamat email Anda untuk melacak pesanan di tautan berikut:</p>
          <p style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/check-booking" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Cek Pesanan Saya</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Ini adalah email otomatis. Harap tidak membalas email ini.</p>
        </div>
      `,
    });
    
    if (response.error) {
       logger.error('Resend API failed to send confirmation email', { error: response.error });
    } else {
       logger.info('Booking confirmation email sent', { bookingCode: data.bookingCode, email: data.email, id: response.data?.id });
    }
  } catch (error: any) {
    logger.error('Unexpected error sending confirmation email', { error: error?.message });
  }
};

export const sendBookingRecovery = async (email: string, reservations: any[]) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Skipping booking recovery email; RESEND_API_KEY is missing');
    return;
  }

  try {
    const listHtml = reservations.map(r => `
      <li style="margin-bottom: 15px;">
        Kamar <b>${r.room.roomType}</b> (${new Date(r.checkInDate).toLocaleDateString('id-ID')} - ${new Date(r.checkOutDate).toLocaleDateString('id-ID')})<br/>
        Kode Booking: <span style="font-family: monospace; color: #991b1b; padding: 2px 6px; background: #fee2e2; border-radius: 4px; font-weight: bold; font-size: 16px;">${r.bookingCode}</span>
      </li>
    `).join('');
    const response = await resend.emails.send({
      from: `Ron's Guesthouse <${fromEmail}>`,
      to: email,
      subject: `Pemulihan Kode Booking - Ron's Guesthouse`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #b91c1c;">Informasi Pesanan Anda</h2>
          <p>Kami menerima permintaan untuk mengirimkan kode booking yang terkait dengan alamat email ini. Berikut adalah daftar pesanan aktif Anda:</p>
          
          <ul style="list-style: none; padding-left: 0; background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${listHtml}
          </ul>

          <p>Anda dapat melacak pesanan Anda melalui tautan berikut:</p>
          <p style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/check-booking" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Cek Pesanan Saya</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Jika Anda tidak merasa meminta email ini, silakan abaikan pesan ini. Sistem kami sangat aman.</p>
        </div>
      `,
    });
    
    if (response.error) {
       logger.error('Resend API failed to send recovery email', { error: response.error });
    } else {
       logger.info('Booking recovery email sent', { email, count: reservations.length });
    }
  } catch (error: any) {
    logger.error('Unexpected error sending recovery email', { error: error?.message });
  }
};
