// Kode 4.18 - Potongan Kode Pengiriman Email Konfirmasi
// File: backend/src/services/email.service.ts

import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendBookingConfirmation = async (data: BookingEmailData) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Skipping booking confirmation email; RESEND_API_KEY is missing');
    return; // Graceful degradation jika API key tidak ada
  }

  const checkIn  = new Date(data.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const checkOut = new Date(data.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const price    = Number(data.totalPrice).toLocaleString('id-ID');

  await resend.emails.send({
    from:    `Ron's Guesthouse <${fromEmail}>`,
    to:      data.email,
    subject: `Konfirmasi Pemesanan - ${data.bookingCode}`,
    html:    `<!-- Template HTML dengan detail booking -->`,
  });
};

// Pengiriman dilakukan secara fire-and-forget (tidak memblokir API response):
if (guest.email) {
  import('../services/email.service')
    .then(({ sendBookingConfirmation }) => {
      sendBookingConfirmation({
        bookingCode: reservation.bookingCode,
        guestName:   guest.fullName,
        roomType:    reservation.room.roomType,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        totalPrice:  reservation.totalPrice.toString(),
        email:       guest.email as string,
      });
    });
}
