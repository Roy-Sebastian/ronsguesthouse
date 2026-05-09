"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBookingInput = validateBookingInput;
exports.checkRoomAvailability = checkRoomAvailability;
exports.calculateBookingPrice = calculateBookingPrice;
exports.getRoomPrices = getRoomPrices;
exports.upsertRoomPrice = upsertRoomPrice;
exports.bulkUpsertRoomPrices = bulkUpsertRoomPrices;
exports.deleteRoomPrice = deleteRoomPrice;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const prisma_1 = require("../config/prisma");
const reservation_constants_1 = require("../constants/reservation.constants");
const db_repository_1 = require("../repositories/db.repository");
const room_price_repository_1 = require("../repositories/room-price.repository");
const date_utils_1 = require("../utils/date.utils");
// ─── Input Validation ──────────────────────────────────────────────
async function validateBookingInput(roomId, checkIn, checkOut, tx = prisma_1.prisma, options = {}) {
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        throw Object.assign(new Error('Tanggal tidak valid'), { statusCode: 400 });
    }
    if (checkIn >= checkOut) {
        throw Object.assign(new Error('Tanggal check-in harus sebelum check-out'), { statusCode: 400 });
    }
    if (!options.allowPastDates) {
        const today = (0, date_utils_1.normalizeToUTCMidnight)(new Date());
        if ((0, date_utils_1.normalizeToUTCMidnight)(checkIn) < today) {
            throw Object.assign(new Error('Tanggal check-in tidak boleh di masa lalu'), { statusCode: 400 });
        }
    }
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights > reservation_constants_1.MAX_STAY_NIGHTS) {
        throw Object.assign(new Error(`Durasi menginap maksimal ${reservation_constants_1.MAX_STAY_NIGHTS} malam`), { statusCode: 400 });
    }
    const room = await tx.room.findUnique({ where: { id: roomId } });
    if (!room) {
        throw Object.assign(new Error('Kamar tidak ditemukan'), { statusCode: 404 });
    }
    if (room.status === 'inactive' || room.status === 'maintenance') {
        throw Object.assign(new Error('Kamar sedang tidak tersedia'), { statusCode: 400 });
    }
    return room;
}
// ─── Availability Check (per-date with stock) ──────────────────────
async function checkRoomAvailability(roomId, checkIn, checkOut, tx = prisma_1.prisma) {
    const room = await tx.room.findUnique({ where: { id: roomId } });
    if (!room)
        throw Object.assign(new Error('Kamar tidak ditemukan'), { statusCode: 404 });
    // Single raw query: count active reservations PER DATE using generate_series
    const statusValues = client_1.Prisma.join(reservation_constants_1.INACTIVE_STATUSES);
    const conflicts = await tx.$queryRaw `
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
    const fullyBookedDates = conflicts.map((r) => {
        const d = r.d instanceof Date ? r.d : new Date(r.d);
        return d.toISOString().slice(0, 10);
    });
    return { available: fullyBookedDates.length === 0, fullyBookedDates };
}
async function calculateBookingPrice(roomId, checkIn, checkOut, tx = prisma_1.prisma) {
    // 1. Get room base price
    const room = await tx.room.findUnique({ where: { id: roomId } });
    if (!room)
        throw Object.assign(new Error('Kamar tidak ditemukan'), { statusCode: 404 });
    const basePrice = Number(room.pricePerNight);
    const normalizedCheckIn = (0, date_utils_1.normalizeToUTCMidnight)(checkIn);
    const normalizedCheckOut = (0, date_utils_1.normalizeToUTCMidnight)(checkOut);
    // 2. Fetch all price overrides in ONE query
    const overrides = await room_price_repository_1.roomPriceRepository.findByRoomAndDateRange(roomId, normalizedCheckIn, normalizedCheckOut, tx);
    // 3. Build override map
    const overrideMap = new Map();
    for (const override of overrides) {
        overrideMap.set((0, date_utils_1.toDateOnlyString)(override.date), Number(override.price));
    }
    // 4. Iterate each night, apply override or fallback to base
    const dates = (0, date_utils_1.generateDateRange)(normalizedCheckIn, normalizedCheckOut);
    const breakdown = [];
    let totalPrice = 0;
    for (const date of dates) {
        const dateKey = (0, date_utils_1.toDateOnlyString)(date);
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
async function getRoomPrices(roomId, startDate, endDate) {
    if (startDate && endDate) {
        return room_price_repository_1.roomPriceRepository.findByRoomAndDateRange(roomId, startDate, endDate);
    }
    return room_price_repository_1.roomPriceRepository.findAll({ where: { roomId }, orderBy: { date: 'asc' } });
}
async function upsertRoomPrice(roomId, date, price) {
    if (price < 0) {
        throw Object.assign(new Error('Harga tidak boleh negatif'), { statusCode: 400 });
    }
    const normalizedDate = (0, date_utils_1.normalizeToUTCMidnight)(date);
    return room_price_repository_1.roomPriceRepository.upsert(roomId, normalizedDate, price);
}
async function bulkUpsertRoomPrices(roomId, entries) {
    // Validate: no duplicate dates in input
    const dateSet = new Set();
    for (const entry of entries) {
        const key = (0, date_utils_1.toDateOnlyString)((0, date_utils_1.normalizeToUTCMidnight)(new Date(entry.date)));
        if (dateSet.has(key)) {
            throw Object.assign(new Error(`Tanggal duplikat dalam input: ${key}`), { statusCode: 400 });
        }
        dateSet.add(key);
        if (entry.price < 0) {
            throw Object.assign(new Error(`Harga tidak boleh negatif untuk tanggal ${key}`), { statusCode: 400 });
        }
    }
    // Wrap all upserts in a single transaction
    return db_repository_1.dbRepository.transaction(async (tx) => {
        const results = [];
        for (const entry of entries) {
            const normalizedDate = (0, date_utils_1.normalizeToUTCMidnight)(new Date(entry.date));
            const result = await room_price_repository_1.roomPriceRepository.upsert(roomId, normalizedDate, entry.price, tx);
            results.push(result);
        }
        logger_1.logger.info('Bulk upsert room prices', { roomId, count: results.length });
        return results;
    });
}
async function deleteRoomPrice(id) {
    return room_price_repository_1.roomPriceRepository.delete(id);
}
