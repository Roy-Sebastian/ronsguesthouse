/**
 * Normalize a date to UTC midnight (00:00:00.000Z).
 * Strips time component for consistent date-only comparisons.
 */
export function normalizeToUTCMidnight(date: Date | string): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Generate an array of UTC midnight dates from checkIn (inclusive) to checkOut (exclusive).
 * Each date represents one night of stay.
 */
export function generateDateRange(checkIn: Date, checkOut: Date): Date[] {
  const start = normalizeToUTCMidnight(checkIn);
  const end = normalizeToUTCMidnight(checkOut);
  const dates: Date[] = [];

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
export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
