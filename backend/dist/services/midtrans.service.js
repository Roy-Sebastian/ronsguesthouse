"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSnapToken = createSnapToken;
exports.chargeMidtrans = chargeMidtrans;
exports.checkTransactionStatus = checkTransactionStatus;
exports.processMidtransNotification = processMidtransNotification;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const midtrans_client_1 = __importDefault(require("midtrans-client"));
const logger_1 = require("../config/logger");
const prisma_1 = require("../config/prisma");
const transaction_repository_1 = require("../repositories/transaction.repository");
/**
 * REFUND STRATEGY: Manual/Admin-Driven
 *
 * When a payment arrives for an expired or cancelled reservation:
 * 1. Transaction is marked paymentStatus='refunded' internally
 * 2. A note is attached explaining the reason
 * 3. The Midtrans Refund API is NOT called automatically
 * 4. Admin must process the actual refund via:
 *    - Midtrans Dashboard (https://dashboard.midtrans.com)
 *    - Or a future POST /api/transactions/:id/refund endpoint
 *
 * Rationale: Automatic refunds carry financial risk and require
 * production Midtrans API keys with refund permissions. Hotel staff
 * should review each case before releasing funds.
 */
// ─── Midtrans Snap Client ──────────────────────────────────────────
const snap = new midtrans_client_1.default.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
});
async function createSnapToken(input) {
    const parameter = {
        transaction_details: {
            order_id: input.orderId,
            gross_amount: Math.round(input.grossAmount),
        },
        credit_card: {
            secure: true,
        },
        customer_details: {
            first_name: input.customerName || 'Guest',
            email: input.customerEmail || undefined,
            phone: input.customerPhone || undefined,
        },
    };
    const transaction = await snap.createTransaction(parameter);
    logger_1.logger.info('Snap token created', { orderId: input.orderId, reservationId: input.reservationId });
    return { token: transaction.token, redirect_url: transaction.redirect_url };
}
// ─── Legacy charge function (kept for backward compat) ─────────────
async function chargeMidtrans(amount) {
    const orderId = `RONS-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    const authString = Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString('base64');
    const midtransRes = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify({
            transaction_details: { order_id: orderId, gross_amount: amount },
        }),
    });
    const midtransData = (await midtransRes.json());
    if (!midtransData.token)
        throw new Error('Gagal mendapatkan token dari Midtrans');
    return { snap_token: midtransData.token, order_id: orderId };
}
// ─── Midtrans Core Client for Status API ────────────────────────────
const coreApi = new midtrans_client_1.default.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
});
async function checkTransactionStatus(orderId) {
    return await coreApi.transaction.status(orderId);
}
async function processMidtransNotification(body) {
    const { order_id, transaction_status, gross_amount, signature_key, status_code } = body;
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    // 1. Verify Signature
    const hash = crypto_1.default
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest('hex');
    if (hash !== signature_key) {
        logger_1.logger.warn('Invalid Midtrans webhook signature', { orderId: order_id });
        throw Object.assign(new Error('Invalid signature'), { statusCode: 400 });
    }
    // 2. Find Transaction
    const trx = await transaction_repository_1.transactionRepository.findAll({ where: { midtransOrderId: order_id } });
    if (trx.length === 0) {
        logger_1.logger.warn('Webhook for unknown order', { orderId: order_id });
        return;
    }
    const transaction = trx[0];
    // 3. Idempotency Check
    if (transaction.paymentStatus === 'paid' || transaction.paymentStatus === 'refunded') {
        logger_1.logger.info('Duplicate webhook ignored', { orderId: order_id, existingStatus: transaction.paymentStatus });
        return;
    }
    const reservation = await prisma_1.prisma.reservation.findUnique({
        where: { id: transaction.reservationId },
        include: { guest: true, room: true },
    });
    if (!reservation) {
        logger_1.logger.warn('Webhook for unknown reservation', { reservationId: transaction.reservationId });
        return;
    }
    // 4. Map Status
    let internalStatus = 'pending';
    // Note: 'capture' is for credit card, 'settlement' is for everything else
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
        internalStatus = 'paid';
    }
    else if (transaction_status === 'expire') {
        internalStatus = 'expired';
    }
    else if (transaction_status === 'cancel' || transaction_status === 'deny') {
        internalStatus = 'failed';
    }
    else if (transaction_status === 'pending') {
        internalStatus = 'pending';
    }
    // 5. Update Database Sync Flow
    if (internalStatus === 'paid') {
        // 6. Late Payment Handling
        if (reservation.status === client_1.ReservationStatus.expired || reservation.status === client_1.ReservationStatus.cancelled) {
            await transaction_repository_1.transactionRepository.update(transaction.id, {
                data: {
                    paymentStatus: 'refunded',
                    notes: 'Payment received after expiry',
                },
            });
            logger_1.logger.warn('Payment for expired/cancelled reservation', {
                orderId: order_id,
                reservationId: reservation.id,
                reservationStatus: reservation.status,
            });
            return;
        }
        // Mark as paid
        await transaction_repository_1.transactionRepository.update(transaction.id, {
            data: { paymentStatus: 'paid', paymentDate: new Date() },
        });
        // Dashboard Integration: Create Income record
        await prisma_1.prisma.income.create({
            data: {
                transactionId: transaction.id,
                amount: transaction.amount,
                description: `Online Payment (Midtrans) - Booking ID: ${reservation.id.slice(-6).toUpperCase()}`,
                incomeDate: new Date(),
                sourceType: 'RESERVATION',
                referenceId: reservation.id,
                paymentMethod: transaction.paymentMethod || 'transfer',
                status: 'paid',
                guestNameSnapshot: reservation.guest?.fullName,
                roomNumberSnapshot: reservation.room?.roomNumber,
                type: 'income',
            },
        });
        // Confirm the reservation
        await prisma_1.prisma.reservation.update({
            where: { id: reservation.id },
            data: { status: client_1.ReservationStatus.confirmed, expiresAt: null },
        });
        logger_1.logger.info('Reservation confirmed via payment', { orderId: order_id, reservationId: reservation.id });
    }
    else if (internalStatus === 'expired' || internalStatus === 'failed') {
        // Mark transaction as cancelled
        await transaction_repository_1.transactionRepository.update(transaction.id, {
            data: { paymentStatus: 'cancelled' },
        });
        // If reservation is still pending, move it to expired/cancelled appropriately
        if (reservation.status === client_1.ReservationStatus.pending) {
            const newStatus = internalStatus === 'expired' ? client_1.ReservationStatus.expired : client_1.ReservationStatus.cancelled;
            await prisma_1.prisma.reservation.update({
                where: { id: reservation.id },
                data: { status: newStatus, expiresAt: null },
            });
        }
        logger_1.logger.info(`Webhook processed: ${internalStatus}`, { orderId: order_id, reservationId: reservation.id });
    }
    else {
        // pending
        logger_1.logger.info('Webhook processed: pending', { orderId: order_id, reservationId: reservation.id });
    }
}
