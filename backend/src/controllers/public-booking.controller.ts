import crypto from 'crypto';

import { Request, Response } from 'express';

import { prisma } from '../config/prisma';
import { getIO } from '../config/socket';

function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unambiguous alphanumeric
  let result = 'RONS-';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
import { logger } from '../config/logger';
import {
  BOOKING_EXPIRY_MINUTES,
  TX_TIMEOUT_MS,
  TX_MAX_RETRIES,
} from '../constants/reservation.constants';
import { transactionRepository } from '../repositories/transaction.repository';
import * as MidtransService from '../services/midtrans.service';
import * as PricingService from '../services/pricing.service';
import { toTitleCase } from '../utils';

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
export const publicBook = async (req: Request, res: Response) => {
  try {
    const {
      roomId,
      checkIn,
      checkOut,
      guestName,
      guestPhone,
      guestEmail,
      specialRequests,
      numGuests,
    } = req.body;

    // Validate required fields; Email & Phone become mandatory identifiers
    if (!roomId || !checkIn || !checkOut || !guestName || !guestPhone || !guestEmail) {
      return res.status(400).json({
        error: 'roomId, checkIn, checkOut, guestName, guestPhone, dan guestEmail wajib diisi',
      });
    }

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const normalizedName  = toTitleCase(guestName);

    // 1. Find or create guest securely without ID Number
    // Match by email only (primary identifier). Matching by phone OR email previously
    // caused data corruption when two different guests shared a phone number — the
    // second booking would overwrite the first guest's email/name.
    const normalizedEmail = String(guestEmail).trim().toLowerCase();

    let guest = await prisma.guest.findFirst({
      where: { email: normalizedEmail },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          fullName: normalizedName,
          phone: guestPhone,
          email: normalizedEmail,
          nationality: 'Indonesia',
          category: 'Lokal',
        },
      });
    } else {
      // Same email = same guest — sync latest name/phone from form
      const shouldUpdate = guest.phone !== guestPhone || guest.fullName !== normalizedName;
      if (shouldUpdate) {
        guest = await prisma.guest.update({
          where: { id: guest.id },
          data: {
            fullName: normalizedName,
            phone: guestPhone,
          },
        });
      }
    }

    // 2. Create reservation with retry for serialization conflicts or booking code collision
    let reservation: any;
    for (let attempt = 0; attempt <= TX_MAX_RETRIES; attempt++) {
      try {
        const generatedCode = generateBookingCode();
        
        reservation = await prisma.$transaction(async (tx) => {
          // Validate input
          await PricingService.validateBookingInput(roomId, checkInDate, checkOutDate, tx);

          // Check availability
          const { available, fullyBookedDates } = await PricingService.checkRoomAvailability(
            roomId, checkInDate, checkOutDate, tx
          );
          if (!available) {
            throw Object.assign(
              new Error(`Kamar tidak tersedia pada tanggal: ${fullyBookedDates.join(', ')}`),
              { statusCode: 409, fullyBookedDates },
            );
          }

          // Calculate price server-side
          const { totalPrice } = await PricingService.calculateBookingPrice(
            roomId, checkInDate, checkOutDate, tx
          );

          // Get a default user for the userId field
          const defaultUser = await tx.user.findFirst();
          const userId = defaultUser?.id || 'system';

          const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000);

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
              guest: { connect: { id: guest!.id } },
              user: { connect: { id: userId } },
            },
            include: {
              guest: { select: { id: true, fullName: true, phone: true, email: true } },
              room: { select: { id: true, roomNumber: true, roomType: true } },
            },
          });
        }, {
          isolationLevel: 'Serializable',
          timeout: TX_TIMEOUT_MS,
        });
        break; // success
      } catch (error: any) {
        if ((error.code === 'P2034' || error.code === 'P2002') && attempt < TX_MAX_RETRIES) {
          logger.warn('Conflict on public booking (serialization or bookingCode collision), retrying', { roomId, attempt: attempt + 1 });
          continue;
        }
        throw error;
      }
    }

    // 3. Create transaction record + Snap token
    const orderId = `RONS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await transactionRepository.create({
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

    logger.info('Public booking created', {
      reservationId: reservation.id,
      roomId,
      totalPrice: reservation.totalPrice,
    });

    // Fire email asynchronously (fire-and-forget) to not block the API response
    if (guest.email) {
      import('../services/email.service')
        .then(({ sendBookingConfirmation }) => {
          sendBookingConfirmation({
            bookingCode: reservation.bookingCode,
            guestName: guest.fullName,
            roomType: reservation.room.roomType,
            checkInDate: reservation.checkInDate,
            checkOutDate: reservation.checkOutDate,
            totalPrice: reservation.totalPrice.toString(),
            email: guest.email as string,
          });
        })
        .catch(err => logger.error('Failed to load email service', { error: err?.message }));
    }

    // 4. Fire real-time WebSocket events to update Receptionist and Dashboard sidebars
    const io = getIO();
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
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    logger.error('Public booking failed', { error: error.message });
    res.status(statusCode).json({ error: error.message || 'Gagal membuat booking' });
  }
};

/**
 * POST /api/public/check-booking
 * Public endpoint — guest dapat lookup booking hanya dengan kode booking.
 * Brute-force diproteksi guestAccessRateLimiter; respons sudah di-mask.
 */
export const checkBookingAccess = async (req: Request, res: Response) => {
  try {
    const { bookingCode } = req.body;

    if (!bookingCode) {
      return res.status(400).json({ error: 'Kode Booking wajib diisi' });
    }

    const normalizedCode = String(bookingCode).trim().toUpperCase();

    const reservation = await prisma.reservation.findFirst({
      where: { bookingCode: normalizedCode },
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
      logger.warn('Failed booking access attempt', { bookingCode: normalizedCode, ip, userAgent });
      return res.status(404).json({ error: 'Booking tidak ditemukan' });
    }

    logger.info('Successful booking access', { bookingCode: normalizedCode, ip, userAgent });

    // Data Masking
    const maskEmail = (e: string) => {
      const parts = e.split('@');
      if (parts.length !== 2) return e;
      const [name, domain] = parts;
      return name[0] + '***@' + domain;
    };
    
    const maskPhone = (p: string) => {
      if (p.length < 5) return '***';
      return p.substring(0, 2) + '*'.repeat(Math.max(0, p.length - 5)) + p.substring(p.length - 3);
    };

    const resAny = reservation as any;
    const maskedReservation = {
      ...resAny,
      guest: {
        ...resAny.guest,
        email: resAny.guest?.email ? maskEmail(resAny.guest.email) : null,
        phone: resAny.guest?.phone ? maskPhone(resAny.guest.phone) : null,
      }
    };

    res.json(maskedReservation);
  } catch (error: any) {
    logger.error('Check booking error', { error: error.message });
    res.status(500).json({ error: 'Terjadi kesalahan sistem' });
  }
};

/**
 * POST /api/public/forgot-booking
 * Guest recovery endpoint to retrieve their booking code via email
 */
export const forgotBooking = async (req: Request, res: Response) => {
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
        const reservations = await prisma.reservation.findMany({
          where: { guest: { email: normalizedEmail } },
          include: { room: true },
          orderBy: { createdAt: 'desc' }
        });

        if (reservations.length > 0) {
          const { sendBookingRecovery } = await import('../services/email.service');
          await sendBookingRecovery(normalizedEmail, reservations);
        }
      } catch (err: any) {
        logger.error('Background recovery email failed', { error: err?.message, email: normalizedEmail });
      }
    };

    // Execute asynchronously to immediately free the client connection
    processRecovery();

    // Security: Always return generic success immediately
    res.json({ message: 'Jika email terdaftar pada sistem kami, informasi pemesanan (Kode Booking) telah dikirimkan ke kotak masuk Anda. Harap periksa folder Spam jika tidak menemukannya.' });
  } catch (error: any) {
    logger.error('Forgot booking error', { error: error.message });
    res.status(500).json({ error: 'Terjadi kesalahan sistem' });
  }
};
