// Kode 4.11 - Potongan Kode State Machine Status Reservasi
// File: backend/src/constants/reservation.constants.ts

import { ReservationStatus } from '@prisma/client';

/** Status yang TIDAK memblokir ketersediaan kamar */
export const INACTIVE_STATUSES = [
  ReservationStatus.cancelled,
  ReservationStatus.no_show,
  ReservationStatus.expired,
] as const;

/** Status terminal — tidak ada transisi lebih lanjut */
export const TERMINAL_STATUSES = [
  ReservationStatus.checked_out,
  ReservationStatus.cancelled,
  ReservationStatus.no_show,
  ReservationStatus.expired,
] as const;

/** Peta transisi status yang diizinkan */
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [ReservationStatus.pending]:     ['pending', 'confirmed', 'cancelled', 'no_show'],
  [ReservationStatus.confirmed]:   ['confirmed', 'checked_in', 'cancelled', 'no_show'],
  [ReservationStatus.checked_in]:  ['checked_in', 'checked_out'],
  [ReservationStatus.checked_out]: [], // Terminal
  [ReservationStatus.cancelled]:   [], // Terminal
  [ReservationStatus.no_show]:     [], // Terminal
  [ReservationStatus.expired]:     [], // Terminal
};

// Penggunaan di reservation.service.ts:
const allowed = ALLOWED_TRANSITIONS[current.status] || [];
if (!allowed.includes(nextStatus)) {
  throw new AppError(`Transisi tidak valid: ${current.status} -> ${nextStatus}`);
}
