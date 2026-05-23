import { ReservationStatus } from '@prisma/client';

/** Statuses that should NOT block room availability */
export const INACTIVE_STATUSES = [
  ReservationStatus.cancelled,
  ReservationStatus.no_show,
  ReservationStatus.expired,
  ReservationStatus.checked_out, // checked_out = kamar sudah bebas, tidak boleh blokir tanggal baru
] as const;

/** Terminal statuses — no further transitions allowed */
export const TERMINAL_STATUSES = [
  ReservationStatus.checked_out,
  ReservationStatus.cancelled,
  ReservationStatus.no_show,
  ReservationStatus.expired,
] as const;

/** Allowed status transitions map */
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [ReservationStatus.pending]:     [ReservationStatus.pending, ReservationStatus.confirmed, ReservationStatus.cancelled, ReservationStatus.no_show],
  [ReservationStatus.confirmed]:   [ReservationStatus.confirmed, ReservationStatus.checked_in, ReservationStatus.cancelled, ReservationStatus.no_show],
  [ReservationStatus.checked_in]:  [ReservationStatus.checked_in, ReservationStatus.checked_out],
  [ReservationStatus.checked_out]: [],
  [ReservationStatus.cancelled]:   [],
  [ReservationStatus.no_show]:     [],
  [ReservationStatus.expired]:     [],
};

export const BOOKING_EXPIRY_MINUTES = Number(process.env.BOOKING_EXPIRY_MINUTES) || 15;
export const MAX_STAY_NIGHTS = 30;
export const TX_TIMEOUT_MS = Number(process.env.BOOKING_TX_TIMEOUT_MS) || 10_000;
export const TX_MAX_RETRIES = 1;
