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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotBooking = exports.checkBookingAccess = exports.publicBook = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../config/prisma");
const socket_1 = require("../config/socket");
function generateBookingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unambiguous alphanumeric
    let result = 'RONS-';
    const bytes = crypto_1.default.randomBytes(8);
    for (let i = 0; i < 8; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}
const logger_1 = require("../config/logger");
const reservation_constants_1 = require("../constants/reservation.constants");
const transaction_repository_1 = require("../repositories/transaction.repository");
const MidtransService = __importStar(require("../services/midtrans.service"));
const PricingService = __importStar(require("../services/pricing.service"));
/**
 * POST /api/public/book
 *
 * Public endpoint for online booking (no auth required).
 * Creates guest (or finds existing), reservation, transaction, and Snap token in one call.
 *
 * Body: {
 *   roomId, checkIn, checkOut,
 *   guestName, guestIdNumber, guestPhone, guestEmail?,
 *   specialRequests?, numGuests?
 * }
 */
const publicBook = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, guestName, guestPhone, guestEmail, specialRequests, numGuests, } = req.body;
        // Validate required fields; Email & Phone become mandatory identifiers
        if (!roomId || !checkIn || !checkOut || !guestName || !guestPhone || !guestEmail) {
            return res.status(400).json({
                error: 'roomId, checkIn, checkOut, guestName, guestPhone, dan guestEmail wajib diisi',
            });
        }
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        // 1. Find or create guest securely without ID Number
        const normalizedEmail = String(guestEmail).trim().toLowerCase();
        let guest = await prisma_1.prisma.guest.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { phone: guestPhone }
                ]
            }
        });
        if (!guest) {
            guest = await prisma_1.prisma.guest.create({
                data: {
                    fullName: guestName,
                    phone: guestPhone,
                    email: normalizedEmail,
                    nationality: 'Indonesia',
                    category: 'Lokal',
                },
            });
        }
        else {
            // Sync latest guest form data to their profile in case they used a new email or phone number
            const shouldUpdate = guest.email !== normalizedEmail || guest.phone !== guestPhone || guest.fullName !== guestName;
            if (shouldUpdate) {
                guest = await prisma_1.prisma.guest.update({
                    where: { id: guest.id },
                    data: {
                        fullName: guestName,
                        phone: guestPhone,
                        email: normalizedEmail,
                    }
                });
            }
        }
        // 2. Create reservation with retry for serialization conflicts or booking code collision
        let reservation;
        for (let attempt = 0; attempt <= reservation_constants_1.TX_MAX_RETRIES; attempt++) {
            try {
                const generatedCode = generateBookingCode();
                reservation = await prisma_1.prisma.$transaction(async (tx) => {
                    // Validate input
                    await PricingService.validateBookingInput(roomId, checkInDate, checkOutDate, tx);
                    // Check availability
                    const { available, fullyBookedDates } = await PricingService.checkRoomAvailability(roomId, checkInDate, checkOutDate, tx);
                    if (!available) {
                        throw Object.assign(new Error(`Kamar tidak tersedia pada tanggal: ${fullyBookedDates.join(', ')}`), { statusCode: 409, fullyBookedDates });
                    }
                    // Calculate price server-side
                    const { totalPrice } = await PricingService.calculateBookingPrice(roomId, checkInDate, checkOutDate, tx);
                    // Get a default user for the userId field
                    const defaultUser = await tx.user.findFirst();
                    const userId = defaultUser?.id || 'system';
                    const expiresAt = new Date(Date.now() + reservation_constants_1.BOOKING_EXPIRY_MINUTES * 60 * 1000);
                    return await tx.reservation.create({
                        data: {
                            bookingCode: generatedCode,
                            checkInDate,
                            checkOutDate,
                            totalPrice,
                            expiresAt,
                            numGuests: numGuests || 1,
                            specialRequests: specialRequests || null,
                            room: { connect: { id: roomId } },
                            guest: { connect: { id: guest.id } },
                            user: { connect: { id: userId } },
                        },
                        include: {
                            guest: { select: { id: true, fullName: true, phone: true, email: true } },
                            room: { select: { id: true, roomNumber: true, roomType: true } },
                        },
                    });
                }, {
                    isolationLevel: 'Serializable',
                    timeout: reservation_constants_1.TX_TIMEOUT_MS,
                });
                break; // success
            }
            catch (error) {
                if ((error.code === 'P2034' || error.code === 'P2002') && attempt < reservation_constants_1.TX_MAX_RETRIES) {
                    logger_1.logger.warn('Conflict on public booking (serialization or bookingCode collision), retrying', { roomId, attempt: attempt + 1 });
                    continue;
                }
                throw error;
            }
        }
        // 3. Create transaction record + Snap token
        const orderId = `RONS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await transaction_repository_1.transactionRepository.create({
            data: {
                reservationId: reservation.id,
                amount: reservation.totalPrice,
                paymentMethod: 'transfer',
                paymentStatus: 'pending',
                midtransOrderId: orderId,
            },
        });
        const snapResult = await MidtransService.createSnapToken({
            reservationId: reservation.id,
            orderId,
            grossAmount: Number(reservation.totalPrice),
            customerName: guest.fullName,
            customerEmail: guest.email || undefined,
            customerPhone: guest.phone || undefined,
        });
        logger_1.logger.info('Public booking created', {
            reservationId: reservation.id,
            roomId,
            totalPrice: reservation.totalPrice,
        });
        // Fire email asynchronously (fire-and-forget) to not block the API response
        if (guest.email) {
            Promise.resolve().then(() => __importStar(require('../services/email.service'))).then(({ sendBookingConfirmation }) => {
                sendBookingConfirmation({
                    bookingCode: reservation.bookingCode,
                    guestName: guest.fullName,
                    roomType: reservation.room.roomType,
                    checkInDate: reservation.checkInDate,
                    checkOutDate: reservation.checkOutDate,
                    totalPrice: reservation.totalPrice.toString(),
                    email: guest.email,
                });
            })
                .catch(err => logger_1.logger.error('Failed to load email service', { error: err?.message }));
        }
        // 4. Fire real-time WebSocket events to update Receptionist and Dashboard sidebars
        const io = (0, socket_1.getIO)();
        if (io) {
            io.emit('room_booked', {
                roomId,
                checkInDate: reservation.checkInDate,
                checkOutDate: reservation.checkOutDate
            });
            io.emit('reservation_created', {
                ...reservation,
                source: 'online'
            });
        }
        res.status(201).json({
            reservation,
            payment: {
                token: snapResult.token,
                redirect_url: snapResult.redirect_url,
                order_id: orderId,
            },
            // Security note: In production, the bookingCode should ONLY be displayed once
            // on the success layout/page. Do not expose it in arbitrary read endpoints.
            bookingCode: reservation.bookingCode,
        });
    }
    catch (error) {
        const statusCode = error.statusCode || 500;
        logger_1.logger.error('Public booking failed', { error: error.message });
        res.status(statusCode).json({ error: error.message || 'Gagal membuat booking' });
    }
};
exports.publicBook = publicBook;
/**
 * POST /api/public/check-booking
 * Guest access endpoint to retrieve their booking
 */
const checkBookingAccess = async (req, res) => {
    try {
        const { email, bookingCode } = req.body;
        if (!email || !bookingCode) {
            return res.status(400).json({ error: 'Email dan Kode Booking wajib diisi' });
        }
        // Input normalization
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedCode = String(bookingCode).trim().toUpperCase();
        const reservation = await prisma_1.prisma.reservation.findFirst({
            where: {
                bookingCode: normalizedCode,
                guest: { email: normalizedEmail } // Strictly couple code with owner email
            },
            include: {
                guest: { select: { fullName: true, email: true, phone: true } },
                room: { select: { roomType: true, roomNumber: true, imageUrl: true } },
                transaction: { select: { paymentStatus: true, amount: true } }
            }
        });
        // Audit Logging
        const ip = req.ip || req.connection?.remoteAddress || 'Unknown';
        const userAgent = req.get('user-agent') || 'Unknown';
        if (!reservation) {
            logger_1.logger.warn('Failed booking access attempt', { bookingCode: normalizedCode, ip, userAgent });
            return res.status(404).json({ error: 'Tamu atau Booking tidak ditemukan' });
        }
        logger_1.logger.info('Successful booking access', { bookingCode: normalizedCode, ip, userAgent });
        // Data Masking
        const maskEmail = (e) => {
            const parts = e.split('@');
            if (parts.length !== 2)
                return e;
            const [name, domain] = parts;
            return name[0] + '***@' + domain;
        };
        const maskPhone = (p) => {
            if (p.length < 5)
                return '***';
            return p.substring(0, 2) + '*'.repeat(Math.max(0, p.length - 5)) + p.substring(p.length - 3);
        };
        const resAny = reservation;
        const maskedReservation = {
            ...resAny,
            guest: {
                ...resAny.guest,
                email: resAny.guest?.email ? maskEmail(resAny.guest.email) : null,
                phone: resAny.guest?.phone ? maskPhone(resAny.guest.phone) : null,
            }
        };
        res.json(maskedReservation);
    }
    catch (error) {
        logger_1.logger.error('Check booking error', { error: error.message });
        res.status(500).json({ error: 'Terjadi kesalahan sistem' });
    }
};
exports.checkBookingAccess = checkBookingAccess;
/**
 * POST /api/public/forgot-booking
 * Guest recovery endpoint to retrieve their booking code via email
 */
const forgotBooking = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email wajib diisi' });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        // Fire and forget
        const processRecovery = async () => {
            try {
                // Find all reservations (without status constraints for full tracking)
                const reservations = await prisma_1.prisma.reservation.findMany({
                    where: { guest: { email: normalizedEmail } },
                    include: { room: true },
                    orderBy: { createdAt: 'desc' }
                });
                if (reservations.length > 0) {
                    const { sendBookingRecovery } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
                    await sendBookingRecovery(normalizedEmail, reservations);
                }
            }
            catch (err) {
                logger_1.logger.error('Background recovery email failed', { error: err?.message, email: normalizedEmail });
            }
        };
        // Execute asynchronously to immediately free the client connection
        processRecovery();
        // Security: Always return generic success immediately
        res.json({ message: 'Jika email terdaftar pada sistem kami, informasi pemesanan (Kode Booking) telah dikirimkan ke kotak masuk Anda. Harap periksa folder Spam jika tidak menemukannya.' });
    }
    catch (error) {
        logger_1.logger.error('Forgot booking error', { error: error.message });
        res.status(500).json({ error: 'Terjadi kesalahan sistem' });
    }
};
exports.forgotBooking = forgotBooking;
