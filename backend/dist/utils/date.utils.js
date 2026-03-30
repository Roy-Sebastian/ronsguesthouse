"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeToUTCMidnight = normalizeToUTCMidnight;
exports.generateDateRange = generateDateRange;
exports.toDateOnlyString = toDateOnlyString;
/**
 * Normalize a date to UTC midnight (00:00:00.000Z).
 * Strips time component for consistent date-only comparisons.
 */
function normalizeToUTCMidnight(date) {
    const d = new Date(date);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
/**
 * Generate an array of UTC midnight dates from checkIn (inclusive) to checkOut (exclusive).
 * Each date represents one night of stay.
 */
function generateDateRange(checkIn, checkOut) {
    const start = normalizeToUTCMidnight(checkIn);
    const end = normalizeToUTCMidnight(checkOut);
    const dates = [];
    const current = new Date(start);
    while (current < end) {
        dates.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
}
/**
 * Convert a Date to 'YYYY-MM-DD' string for use as Map keys.
 */
function toDateOnlyString(date) {
    return date.toISOString().slice(0, 10);
}
