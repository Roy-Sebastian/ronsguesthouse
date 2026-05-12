// Kode 4.8 - Potongan Kode Generasi Kode Booking
// File: backend/src/controllers/public-booking.controller.ts

import crypto from 'crypto';

function generateBookingCode() {
  // Alfabet anti-ambigu: tanpa I, O, 1, 0 untuk menghindari kebingungan pembacaan
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'RONS-';
  const bytes = crypto.randomBytes(8); // Kriptografis aman
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result; // Contoh: "RONS-K7MZ5BDQ"
  // 32^8 ≈ 1 triliun kemungkinan kode
}

// Penggunaan di dalam transaksi Prisma dengan retry untuk collision:
for (let attempt = 0; attempt <= TX_MAX_RETRIES; attempt++) {
  try {
    const generatedCode = generateBookingCode();
    reservation = await prisma.$transaction(async (tx) => {
      return await tx.reservation.create({
        data: { bookingCode: generatedCode, /* ... */ },
      });
    }, { isolationLevel: 'Serializable' });
    break;
  } catch (error: any) {
    // P2002 = unique constraint violation (kode collision) → retry
    if ((error.code === 'P2034' || error.code === 'P2002') && attempt < TX_MAX_RETRIES) {
      continue;
    }
    throw error;
  }
}
