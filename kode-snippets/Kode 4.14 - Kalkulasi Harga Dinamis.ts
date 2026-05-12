// Kode 4.14 - Potongan Kode Kalkulasi Harga Dinamis
// File: backend/src/services/pricing.service.ts

export async function calculateBookingPrice(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  tx: TxClient = prisma,
): Promise<BookingPriceResult> {
  // 1. Ambil harga dasar kamar
  const room = await (tx as any).room.findUnique({ where: { id: roomId } });
  const basePrice = Number(room.pricePerNight);

  // 2. Ambil semua override harga dalam satu query
  const overrides = await roomPriceRepository.findByRoomAndDateRange(
    roomId, normalizedCheckIn, normalizedCheckOut, tx as any,
  );

  // 3. Bangun map override untuk pencarian O(1)
  const overrideMap = new Map<string, number>();
  for (const override of overrides) {
    overrideMap.set(toDateOnlyString(override.date), Number(override.price));
  }

  // 4. Iterasi tiap malam, terapkan override atau fallback ke harga dasar
  const dates = generateDateRange(normalizedCheckIn, normalizedCheckOut);
  const breakdown: PriceBreakdown[] = [];
  let totalPrice = 0;

  for (const date of dates) {
    const dateKey = toDateOnlyString(date);
    const overridePrice = overrideMap.get(dateKey);
    const price = overridePrice !== undefined ? overridePrice : basePrice;
    totalPrice += price;
    breakdown.push({
      date: dateKey,
      price,
      source: overridePrice !== undefined ? 'override' : 'base_price',
    });
  }

  return { totalPrice, nights: dates.length, breakdown };
}
