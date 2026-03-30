"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TX_MAX_RETRIES = exports.TX_TIMEOUT_MS = exports.MAX_STAY_NIGHTS = exports.BOOKING_EXPIRY_MINUTES = exports.ALLOWED_TRANSITIONS = exports.TERMINAL_STATUSES = exports.INACTIVE_STATUSES = void 0;
const client_1 = require("@prisma/client");
/** Statuses that should NOT block room availability */
exports.INACTIVE_STATUSES = [
    client_1.ReservationStatus.cancelled,
    client_1.ReservationStatus.no_show,
    client_1.ReservationStatus.expired,
];
/** Terminal statuses — no further transitions allowed */
exports.TERMINAL_STATUSES = [
    client_1.ReservationStatus.checked_out,
    client_1.ReservationStatus.cancelled,
    client_1.ReservationStatus.no_show,
    client_1.ReservationStatus.expired,
];
/** Allowed status transitions map */
exports.ALLOWED_TRANSITIONS = {
    [client_1.ReservationStatus.pending]: [client_1.ReservationStatus.pending, client_1.ReservationStatus.confirmed, client_1.ReservationStatus.cancelled, client_1.ReservationStatus.no_show],
    [client_1.ReservationStatus.confirmed]: [client_1.ReservationStatus.confirmed, client_1.ReservationStatus.checked_in, client_1.ReservationStatus.cancelled, client_1.ReservationStatus.no_show],
    [client_1.ReservationStatus.checked_in]: [client_1.ReservationStatus.checked_in, client_1.ReservationStatus.checked_out],
    [client_1.ReservationStatus.checked_out]: [],
    [client_1.ReservationStatus.cancelled]: [],
    [client_1.ReservationStatus.no_show]: [],
    [client_1.ReservationStatus.expired]: [],
};
exports.BOOKING_EXPIRY_MINUTES = Number(process.env.BOOKING_EXPIRY_MINUTES) || 15;
exports.MAX_STAY_NIGHTS = 30;
exports.TX_TIMEOUT_MS = Number(process.env.BOOKING_TX_TIMEOUT_MS) || 10_000;
exports.TX_MAX_RETRIES = 1;
