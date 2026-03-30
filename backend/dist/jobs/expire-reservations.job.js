"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExpirationJob = startExpirationJob;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const prisma_1 = require("../config/prisma");
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
function startExpirationJob() {
    logger_1.logger.info('Reservation expiration job started', { intervalMs: INTERVAL_MS });
    setInterval(async () => {
        try {
            const result = await prisma_1.prisma.reservation.updateMany({
                where: {
                    status: client_1.ReservationStatus.pending,
                    expiresAt: { lt: new Date() },
                },
                data: { status: client_1.ReservationStatus.expired },
            });
            if (result.count > 0) {
                logger_1.logger.info('Expired stale reservations', { count: result.count });
            }
        }
        catch (err) {
            logger_1.logger.error('Expiration job error', { error: err });
        }
    }, INTERVAL_MS);
}
