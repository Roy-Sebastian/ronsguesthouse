import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { ReservationStatus } from '@prisma/client';

const INTERVAL_MS = 60_000; // run every 60 seconds

/**
 * Background job that marks pending reservations past their expiresAt as expired.
 *
 * Multi-instance safety:
 * - updateMany is idempotent — multiple instances running simultaneously won't corrupt data
 * - Availability query also includes a lazy check (pending + expiresAt < NOW()) as safety net
 *
 * Scaling path (not implemented):
 * - pg_cron: schedule SQL directly in the DB
 * - BullMQ + Redis: per-booking delayed jobs
 */
export function startExpirationJob() {
  logger.info('Reservation expiration job started', { intervalMs: INTERVAL_MS });

  setInterval(async () => {
    try {
      const result = await prisma.reservation.updateMany({
        where: {
          status: ReservationStatus.pending,
          expiresAt: { lt: new Date() },
        },
        data: { status: ReservationStatus.expired },
      });
      if (result.count > 0) {
        logger.info('Expired stale reservations', { count: result.count });
      }
    } catch (err) {
      logger.error('Expiration job error', { error: err });
    }
  }, INTERVAL_MS);
}
