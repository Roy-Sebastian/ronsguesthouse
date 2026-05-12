// Kode 4.9 - Potongan Kode Pengecekan Ketersediaan Kamar
// File: backend/src/services/pricing.service.ts

export async function checkRoomAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  tx: TxClient = prisma,
): Promise<{ available: boolean; fullyBookedDates: string[] }> {
  const room = await (tx as any).room.findUnique({ where: { id: roomId } });

  // Query tunggal: hitung reservasi aktif PER TANGGAL menggunakan generate_series
  const statusValues = Prisma.join(INACTIVE_STATUSES);
  const conflicts = await (tx as any).$queryRaw<Array<{ d: Date; cnt: bigint }>>`
    SELECT gs.d::date AS d, COUNT(DISTINCT r.id) AS cnt
    FROM generate_series(
      ${checkIn}::date,
      (${checkOut}::date - interval '1 day')::date,
      interval '1 day'
    ) AS gs(d)
    LEFT JOIN reservations r
      ON r."roomId" = ${roomId}
      AND r.status::text NOT IN (${statusValues})
      AND NOT (r.status::text = 'pending' AND r."expiresAt" < NOW())
      AND r."checkInDate"::date <= gs.d
      AND r."checkOutDate"::date > gs.d
    GROUP BY gs.d
    HAVING COUNT(DISTINCT r.id) >= ${room.stock}
    ORDER BY gs.d
  `;

  const fullyBookedDates = conflicts.map((r: any) => {
    const d = r.d instanceof Date ? r.d : new Date(r.d);
    return d.toISOString().slice(0, 10);
  });

  return { available: fullyBookedDates.length === 0, fullyBookedDates };
}
