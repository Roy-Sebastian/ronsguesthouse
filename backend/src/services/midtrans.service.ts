import crypto from 'crypto';

import { ReservationStatus } from '@prisma/client';
import MidtransClient from 'midtrans-client';

import { logger } from '../config/logger';
import { prisma } from '../config/prisma';
import { getIO } from '../config/socket';
import { transactionRepository } from '../repositories/transaction.repository';

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

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const snap = new MidtransClient.Snap({
  isProduction: IS_PRODUCTION,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
});

// ─── Create Snap Transaction Token ─────────────────────────────────

export interface SnapTokenInput {
  reservationId: string;
  orderId: string;
  grossAmount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export async function createSnapToken(input: SnapTokenInput) {
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
  logger.info('Snap token created', { orderId: input.orderId, reservationId: input.reservationId });
  return { token: transaction.token, redirect_url: transaction.redirect_url };
}

// ─── Legacy charge function (kept for backward compat) ─────────────

export async function chargeMidtrans(amount: number) {
  const orderId = `RONS-${Date.now()}-${Math.floor(Math.random() * 100)}`;
  const authString = Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString('base64');
  const midtransHost = IS_PRODUCTION ? 'app.midtrans.com' : 'app.sandbox.midtrans.com';
  const midtransRes = await fetch(`https://${midtransHost}/snap/v1/transactions`, {
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

  const midtransData = (await midtransRes.json()) as { token?: string };
  if (!midtransData.token) throw new Error('Gagal mendapatkan token dari Midtrans');
  return { snap_token: midtransData.token, order_id: orderId };
}

// ─── Midtrans Core Client for Status API ────────────────────────────

const coreApi = new MidtransClient.CoreApi({
  isProduction: IS_PRODUCTION,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
});

export async function checkTransactionStatus(orderId: string) {
  return await coreApi.transaction.status(orderId);
}

// ─── Webhook Notification Processing ───────────────────────────────

export interface MidtransNotificationBody {
  order_id: string;
  transaction_status: string;
  gross_amount: string;
  signature_key: string;
  status_code: string;
  payment_type?: string;
}

export async function processMidtransNotification(body: MidtransNotificationBody) {
  const { order_id, transaction_status, gross_amount, signature_key, status_code } = body;
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

  // 1. Verify Signature
  const hash = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  const hashBuf = Buffer.from(hash);
  const sigBuf = Buffer.from(signature_key);
  const signatureValid =
    hashBuf.length === sigBuf.length &&
    crypto.timingSafeEqual(hashBuf, sigBuf);

  if (!signatureValid) {
    logger.warn('Invalid Midtrans webhook signature', { orderId: order_id });
    throw Object.assign(new Error('Invalid signature'), { statusCode: 400 });
  }

  // 2. Find Transaction
  const trx = await transactionRepository.findAll({ where: { midtransOrderId: order_id } });
  if (trx.length === 0) {
    logger.warn('Webhook for unknown order', { orderId: order_id });
    return;
  }
  const transaction = trx[0];

  // 3. Idempotency Check
  if (transaction.paymentStatus === 'paid' || transaction.paymentStatus === 'refunded') {
    logger.info('Duplicate webhook ignored', { orderId: order_id, existingStatus: transaction.paymentStatus });
    return;
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: transaction.reservationId },
    include: { guest: true, room: true },
  });

  if (!reservation) {
    logger.warn('Webhook for unknown reservation', { reservationId: transaction.reservationId });
    return;
  }

  // 4. Map Status
  let internalStatus: 'pending' | 'paid' | 'failed' | 'expired' = 'pending';
  // Note: 'capture' is for credit card, 'settlement' is for everything else
  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    internalStatus = 'paid';
  } else if (transaction_status === 'expire') {
    internalStatus = 'expired';
  } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
    internalStatus = 'failed';
  } else if (transaction_status === 'pending') {
    internalStatus = 'pending';
  }

  // 5. Update Database Sync Flow
  if (internalStatus === 'paid') {
    // 6. Late Payment Handling
    if (reservation.status === ReservationStatus.expired || reservation.status === ReservationStatus.cancelled) {
      await transactionRepository.update(transaction.id, {
        data: {
          paymentStatus: 'refunded',
          notes: 'Payment received after expiry',
        },
      });
      logger.warn('Payment for expired/cancelled reservation', {
        orderId: order_id,
        reservationId: reservation.id,
        reservationStatus: reservation.status,
      });
      return;
    }

    // Determine actual payment method from Midtrans
    let pMethod: 'cash' | 'transfer' | 'qris' | 'credit_card' | 'debit_card' = 'transfer';
    if (body.payment_type) {
      if (body.payment_type === 'credit_card') pMethod = 'credit_card';
      else if (body.payment_type === 'qris' || body.payment_type === 'gopay' || body.payment_type === 'shopeepay') pMethod = 'qris';
    }

    // Mark as paid and update payment method
    await transactionRepository.update(transaction.id, {
      data: { paymentStatus: 'paid', paymentDate: new Date(), paymentMethod: pMethod },
    });

    // Dashboard Integration: Upsert Income record (idempotent for duplicate webhooks)
    await prisma.income.upsert({
      where: { transactionId: transaction.id },
      create: {
        transactionId: transaction.id,
        amount: transaction.amount,
        description: `Online Payment (Midtrans) - Booking ID: ${reservation.id.slice(-6).toUpperCase()}`,
        incomeDate: new Date(),
        sourceType: 'RESERVATION',
        referenceId: reservation.id,
        paymentMethod: pMethod,
        status: 'paid',
        guestNameSnapshot: reservation.guest?.fullName,
        roomNumberSnapshot: reservation.room?.roomNumber,
        type: 'income',
      },
      update: {},
    });

    // Confirm the reservation
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: ReservationStatus.confirmed, expiresAt: null },
    });

    logger.info('Reservation confirmed via payment', { orderId: order_id, reservationId: reservation.id });

    // Emit real-time event to dashboard staff
    try {
      const io = getIO();
      if (io) {
        io.emit('payment_confirmed', {
          id: reservation.id,
          bookingCode: reservation.bookingCode,
          guestName: reservation.guest?.fullName || 'Tamu',
          roomNumber: reservation.room?.roomNumber || '-',
          amount: transaction.amount,
          paymentMethod: pMethod,
          confirmedAt: new Date().toISOString(),
        });
      }
    } catch (socketErr) {
      logger.warn('Failed to emit payment_confirmed socket event', { error: socketErr });
    }
  } else if (internalStatus === 'expired' || internalStatus === 'failed') {
    // Mark transaction as cancelled
    await transactionRepository.update(transaction.id, {
      data: { paymentStatus: 'cancelled' },
    });

    // If reservation is still pending, move it to expired/cancelled appropriately
    if (reservation.status === ReservationStatus.pending) {
      const newStatus = internalStatus === 'expired' ? ReservationStatus.expired : ReservationStatus.cancelled;
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: newStatus, expiresAt: null },
      });
    }

    logger.info(`Webhook processed: ${internalStatus}`, { orderId: order_id, reservationId: reservation.id });
  } else {
    // pending
    logger.info('Webhook processed: pending', { orderId: order_id, reservationId: reservation.id });
  }
}
