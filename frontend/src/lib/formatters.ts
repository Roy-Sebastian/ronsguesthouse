// ─── Currency Formatting ─────────────────────────────────────────────────────

/**
 * Formats a number as Indonesian Rupiah currency.
 * @example formatRp(250000) → "Rp250.000"
 */
export const formatRp = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

// ─── Date Formatting ─────────────────────────────────────────────────────────

/**
 * Formats an ISO date string to a short localized Indonesian date.
 * @example fmtDate('2026-03-30') → "30 Mar 2026"
 */
export const fmtDate = (dateStr: string): string =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

/**
 * Formats an ISO date string to a full localized Indonesian date.
 * @example fmtDateFull('2026-03-30') → "30 Maret 2026"
 */
export const fmtDateFull = (dateStr: string): string =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

// ─── Night Calculation ───────────────────────────────────────────────────────

/**
 * Calculates the number of nights between two date strings.
 */
export const calculateNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

/**
 * Calculates total days between two date strings (minimum 1).
 */
export const calculateDays = (start: string, end: string): number => {
  const startD = new Date(start);
  const endD = new Date(end);
  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};
