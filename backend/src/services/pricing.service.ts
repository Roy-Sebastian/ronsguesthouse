/**
 * SCALING CONSIDERATIONS (do not implement now)
 *
 * 1. generate_series query:
 *    - Performs well up to ~365 days (capped at 30 by MAX_STAY_NIGHTS)
 *    - If max-stay increases, consider a precomputed room_availability table
 *      updated via triggers on reservation INSERT/UPDATE/DELETE
 *
 * 2. Price calculation caching:
 *    - Room.pricePerNight rarely changes → cache with 5-min TTL
 *    - RoomPrice overrides → Redis cache, invalidate on upsert/delete
 *    - Cache key: `pricing:${roomId}:${checkIn}:${checkOut}`
 *
 * 3. Availability caching:
 *    - Precompute a room_date_availability materialized view
 *    - Refresh on reservation status changes
 *    - Enables O(1) availability lookups per date
 */

import { Prisma } from '@prisma/client';

import { logger } from '../config/logger';
import { prisma } from '../config/prisma';
import { INACTIVE_STATUSES, MAX_STAY_NIGHTS } from '../constants/reservation.constants';
import { dbRepository, type PrismaTransactionClient } from '../repositories/db.repository';
import { roomPriceRepository } from '../repositories/room-price.repository';
import { normalizeToUTCMidnight, generateDateRange, toDateOnlyString } from '../utils/date.utils';

type TxClient = PrismaTransactionClient | typeof prisma;

// ─── Input Validation ──────────────────────────────────────────────

export async function validateBookingInput(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  tx: TxClient = prisma,
) {
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw Object.assign(new Error('Tanggal tidak valid'), { statusCode: 400 });
  }

  if (checkIn >= checkOut) {
    throw Object.assign(new Error('Tanggal check-in harus sebelum check-out'), { statusCode: 400 });
  }

  const today = normalizeToUTCMidnight(new Date());
  if (normalizeToUTCMidnight(checkIn) < today) {
    throw Object.assign(new Error('Tanggal check-in tidak boleh di masa lalu'), { statusCode: 400 });
  }

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights > MAX_STAY_NIGHTS) {
    throw Object.assign(
      new Error(`Durasi menginap maksimal ${MAX_STAY_NIGHTS} malam`),
      { statusCode: 400 },
    );
  }

  const room = await (tx as any).room.findUnique({ where: { id: roomId } });
  if (!room) {
    throw Object.assign(new Error('Kamar tidak ditemukan'), { statusCode: 404 });
  }
  if (room.status === 'inactive' || room.status === 'maintenance') {
    throw Object.assign(new Error('Kamar sedang tidak tersedia'), { statusCode: 400 });
  }

  return room;
}

// ─── Availability Check (per-date with stock) ──────────────────────

export async function checkRoomAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  tx: TxClient = prisma,
): Promise<{ available: boolean; fullyBookedDates: string[] }> {
  const room = await (tx as any).room.findUnique({ where: { id: roomId } });
  if (!room) throw Object.assign(new Error('Kamar tidak ditemukan'), { statusCode: 404 });

  // Single raw query: count active reservations PER DATE using generate_series
  const statusValues = Prisma.join(INACTIVE_STATUSES);
  const conflicts = await (tx as any).$queryRaw<Array<{ d: Date; cnt: bigint }>>`
    SELECT gs.d::date AS d, COUNT(DISTINCT r.id) AS cnt
    FROM generate_series(${checkIn}::date, (${checkOut}::date - interval '1 day')::date, interval '1 day') AS gs(d)
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

// ─── Price Calculation ─────────────────────────────────────────────

export interface PriceBreakdown {
  date: string;
  price: number;
  source: 'override' | 'base_price';
}

export interface BookingPriceResult {
  totalPrice: number;
  nights: number;
  breakdown: PriceBreakdown[];
}

export async function calculateBookingPrice(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  tx: TxClient = prisma,
): Promise<BookingPriceResult> {
  // 1. Get room base price
  const room = await (tx as any).room.findUnique({ where: { id: roomId } });
  if (!room) throw Object.assign(new Error('Kamar tidak ditemukan'), { statusCode: 404 });

  const basePrice = Number(room.pricePerNight);
  const normalizedCheckIn = normalizeToUTCMidnight(checkIn);
  const normalizedCheckOut = normalizeToUTCMidnight(checkOut);

  // 2. Fetch all price overrides in ONE query
  const overrides = await roomPriceRepository.findByRoomAndDateRange(
    roomId,
    normalizedCheckIn,
    normalizedCheckOut,
    tx as any,
  );

  // 3. Build override map
  const overrideMap = new Map<string, number>();
  for (const override of overrides) {
    overrideMap.set(toDateOnlyString(override.date), Number(override.price));
  }

  // 4. Iterate each night, apply override or fallback to base
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

// ─── RoomPrice CRUD ────────────────────────────────────────────────

export async function getRoomPrices(roomId: string, startDate?: Date, endDate?: Date) {
  if (startDate && endDate) {
    return roomPriceRepository.findByRoomAndDateRange(roomId, startDate, endDate);
  }
  return roomPriceRepository.findAll({ where: { roomId }, orderBy: { date: 'asc' } });
}

export async function upsertRoomPrice(roomId: string, date: Date, price: number) {
  if (price < 0) {
    throw Object.assign(new Error('Harga tidak boleh negatif'), { statusCode: 400 });
  }
  const normalizedDate = normalizeToUTCMidnight(date);
  return roomPriceRepository.upsert(roomId, normalizedDate, price);
}

export async function bulkUpsertRoomPrices(
  roomId: string,
  entries: Array<{ date: Date | string; price: number }>,
) {
  // Validate: no duplicate dates in input
  const dateSet = new Set<string>();
  for (const entry of entries) {
    const key = toDateOnlyString(normalizeToUTCMidnight(new Date(entry.date)));
    if (dateSet.has(key)) {
      throw Object.assign(
        new Error(`Tanggal duplikat dalam input: ${key}`),
        { statusCode: 400 },
      );
    }
    dateSet.add(key);
    if (entry.price < 0) {
      throw Object.assign(new Error(`Harga tidak boleh negatif untuk tanggal ${key}`), { statusCode: 400 });
    }
  }

  // Wrap all upserts in a single transaction
  return dbRepository.transaction(async (tx) => {
    const results = [];
    for (const entry of entries) {
      const normalizedDate = normalizeToUTCMidnight(new Date(entry.date));
      const result = await roomPriceRepository.upsert(roomId, normalizedDate, entry.price, tx);
      results.push(result);
    }
    logger.info('Bulk upsert room prices', { roomId, count: results.length });
    return results;
  });
}

export async function deleteRoomPrice(id: string) {
  return roomPriceRepository.delete(id);
}
