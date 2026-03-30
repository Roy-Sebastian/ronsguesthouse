"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPaymentStatus = exports.notification = exports.createSnapToken = exports.charge = void 0;
const MidtransService = __importStar(require("../services/midtrans.service"));
const reservation_repository_1 = require("../repositories/reservation.repository");
const transaction_repository_1 = require("../repositories/transaction.repository");
const logger_1 = require("../config/logger");
const client_1 = require("@prisma/client");
const charge = async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await MidtransService.chargeMidtrans(amount);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'Internal Server Error (Midtrans Charge)' });
    }
};
exports.charge = charge;
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
const createSnapToken = async (req, res) => {
    try {
        const { reservationId } = req.body;
        if (!reservationId) {
            return res.status(400).json({ error: 'reservationId is required' });
        }
        // 1. Find reservation with guest details
        const reservation = await reservation_repository_1.reservationRepository.findById(reservationId, {
            include: {
                guest: { select: { fullName: true, email: true, phone: true } },
                room: { select: { roomNumber: true } },
            },
        });
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        // 2. Ensure reservation is still pending
        if (reservation.status !== client_1.ReservationStatus.pending) {
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
        let transaction = await transaction_repository_1.transactionRepository.findAll({
            where: { reservationId },
        });
        if (transaction.length === 0) {
            // Create new transaction record
            await transaction_repository_1.transactionRepository.create({
                data: {
                    reservationId,
                    amount: reservation.totalPrice,
                    paymentMethod: 'transfer',
                    paymentStatus: 'pending',
                    midtransOrderId: orderId,
                },
            });
        }
        else if (transaction[0].paymentStatus === 'paid') {
            return res.status(400).json({ error: 'Payment already completed' });
        }
        else {
            // Update existing pending transaction with new order ID
            await transaction_repository_1.transactionRepository.update(transaction[0].id, {
                data: { midtransOrderId: orderId },
            });
        }
        // 4. Generate Snap token
        const guest = reservation.guest;
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
    }
    catch (error) {
        logger_1.logger.error('Failed to create Snap token', { error: error.message });
        res.status(500).json({ error: error.message || 'Failed to create payment token' });
    }
};
exports.createSnapToken = createSnapToken;
const notification = async (req, res) => {
    try {
        await MidtransService.processMidtransNotification(req.body);
        res.status(200).send('OK');
    }
    catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).send('Invalid signature');
        }
        res.status(500).send('Webhook Error');
    }
};
exports.notification = notification;
const checkPaymentStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        if (!order_id) {
            return res.status(400).json({ error: 'order_id is required' });
        }
        const response = await MidtransService.checkTransactionStatus(String(order_id));
        // Auto-sync by feeding response to our own webhook processor
        try {
            await MidtransService.processMidtransNotification(response);
        }
        catch (syncError) {
            logger_1.logger.error('Failed to auto-sync payment status', { error: syncError });
            // Proceed to return status even if sync fails
        }
        res.json({ status: response.transaction_status, data: response });
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment status', { error: error.message, order_id: req.params.order_id });
        res.status(500).json({ error: 'Failed to fetch payment status' });
    }
};
exports.checkPaymentStatus = checkPaymentStatus;
