// Kode 4.10 - Potongan Kode Penanganan Pemesanan Bersamaan
// File: backend/src/controllers/public-booking.controller.ts
//
// Menggunakan transaksi Serializable + retry untuk menangani
// dua tamu yang memesan kamar yang sama secara bersamaan.

for (let attempt = 0; attempt <= TX_MAX_RETRIES; attempt++) {
  try {
    reservation = await prisma.$transaction(async (tx) => {
      // Validasi input
      await PricingService.validateBookingInput(roomId, checkInDate, checkOutDate, tx);

      // Cek ketersediaan kamar di dalam transaksi
      const { available, fullyBookedDates } = await PricingService.checkRoomAvailability(
        roomId, checkInDate, checkOutDate, tx
      );
      if (!available) {
        throw Object.assign(
          new Error(`Kamar tidak tersedia pada tanggal: ${fullyBookedDates.join(', ')}`),
          { statusCode: 409 },
        );
      }

      // Hitung harga di sisi server (tidak percaya nilai dari client)
      const { totalPrice } = await PricingService.calculateBookingPrice(
        roomId, checkInDate, checkOutDate, tx
      );

      return await tx.reservation.create({ data: { /* ... */ } });
    }, {
      isolationLevel: 'Serializable', // Mencegah race condition
      timeout: TX_TIMEOUT_MS,
    });
    break; // Berhasil, keluar dari loop

  } catch (error: any) {
    // P2034 = serialization conflict → coba lagi
    if ((error.code === 'P2034' || error.code === 'P2002') && attempt < TX_MAX_RETRIES) {
      continue;
    }
    throw error;
  }
}
