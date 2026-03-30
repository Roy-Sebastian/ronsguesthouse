import { Request, Response } from 'express';
import * as MidtransService from '../services/midtrans.service';
import { reservationRepository } from '../repositories/reservation.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { logger } from '../config/logger';
import { ReservationStatus } from '@prisma/client';

export const charge = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const result = await MidtransService.chargeMidtrans(amount);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal Server Error (Midtrans Charge)' });
  }
};

/**
 * POST /api/payment/snap-token
 * Generate a Midtrans Snap token for a pending reservation.
 *
 * Body: { reservationId: string }
 *
 * Flow:
 * 1. Validate reservation exists and is pending
 * 2. Create or find existing transaction record
 * 3. Generate Snap token via midtrans-client
 * 4. Return token to frontend
 */
export const createSnapToken = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.body;
    if (!reservationId) {
      return res.status(400).json({ error: 'reservationId is required' });
    }

    // 1. Find reservation with guest details
    const reservation = await reservationRepository.findById(reservationId, {
      include: {
        guest: { select: { fullName: true, email: true, phone: true } },
        room: { select: { roomNumber: true } },
      },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // 2. Ensure reservation is still pending
    if (reservation.status !== ReservationStatus.pending) {
      return res.status(400).json({
        error: `Cannot create payment for reservation with status: ${reservation.status}`,
      });
    }

    // Check if reservation has expired
    if (reservation.expiresAt && new Date(reservation.expiresAt) < new Date()) {
      return res.status(400).json({
        error: 'Reservation has expired. Please create a new booking.',
      });
    }

    // 3. Create or find existing transaction record
    const orderId = `RONS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let transaction = await transactionRepository.findAll({
      where: { reservationId },
    });

    if (transaction.length === 0) {
      // Create new transaction record
      await transactionRepository.create({
        data: {
          reservationId,
          amount: reservation.totalPrice,
          paymentMethod: 'transfer',
          paymentStatus: 'pending',
          midtransOrderId: orderId,
        },
      });
    } else if (transaction[0].paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Payment already completed' });
    } else {
      // Update existing pending transaction with new order ID
      await transactionRepository.update(transaction[0].id, {
        data: { midtransOrderId: orderId },
      });
    }

    // 4. Generate Snap token
    const guest = (reservation as any).guest;
    const snapResult = await MidtransService.createSnapToken({
      reservationId,
      orderId,
      grossAmount: Number(reservation.totalPrice),
      customerName: guest?.fullName,
      customerEmail: guest?.email,
      customerPhone: guest?.phone,
    });

    res.json({
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
      order_id: orderId,
    });
  } catch (error: any) {
    logger.error('Failed to create Snap token', { error: error.message });
    res.status(500).json({ error: error.message || 'Failed to create payment token' });
  }
};

export const notification = async (req: Request, res: Response) => {
  try {
    await MidtransService.processMidtransNotification(req.body);
    res.status(200).send('OK');
  } catch (error: any) {
    if ((error as any).statusCode === 400) {
      return res.status(400).send('Invalid signature');
    }
    res.status(500).send('Webhook Error');
  }
};

export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    const response = await MidtransService.checkTransactionStatus(String(order_id));
    
    // Auto-sync by feeding response to our own webhook processor
    try {
      await MidtransService.processMidtransNotification(response);
    } catch (syncError) {
       logger.error('Failed to auto-sync payment status', { error: syncError });
       // Proceed to return status even if sync fails
    }
    
    res.json({ status: response.transaction_status, data: response });
  } catch (error: any) {
    logger.error('Failed to get payment status', { error: error.message, order_id: req.params.order_id });
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};
