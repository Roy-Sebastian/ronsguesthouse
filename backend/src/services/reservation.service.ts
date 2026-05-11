import { ReservationStatus } from '@prisma/client';

import { validateBookingInput, checkRoomAvailability, calculateBookingPrice } from './pricing.service';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';
import { getIO } from '../config/socket';
import {
  ALLOWED_TRANSITIONS,
  BOOKING_EXPIRY_MINUTES,
  TX_TIMEOUT_MS,
  TX_MAX_RETRIES,
} from '../constants/reservation.constants';
import { dbRepository } from '../repositories/db.repository';
import { incomeRepository } from '../repositories/income.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { syncPaidTransactionIncomeForAddOn } from '../utils';
import { appendLine, buildAddOnLogLine, buildIncomeDescriptionWithAddOns } from '../utils';
import { AppError } from '../utils/AppError';

/** Map reservation status → payment status to sync */
function resolvePaymentStatusFromReservation(newReservationStatus: string): 'paid' | 'cancelled' | null {
  if (newReservationStatus === ReservationStatus.confirmed) return 'paid';
  if (newReservationStatus === ReservationStatus.cancelled || newReservationStatus === ReservationStatus.no_show) return 'cancelled';
  return null;
}

export async function getReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  return reservationRepository.findAll({
    where: {
      checkInDate: { gte: tomorrow, lt: dayAfterTomorrow },
      status: { in: [ReservationStatus.pending, ReservationStatus.confirmed] },
    },
    include: {
      guest: { select: { fullName: true, phone: true } },
      room: { select: { roomNumber: true } },
    },
    orderBy: { checkInDate: 'asc' },
  });
}

export async function getRecent(since: Date) {
  return reservationRepository.findAll({
    where: { createdAt: { gt: since } },
    orderBy: { createdAt: 'desc' },
    include: {
      guest: { select: { id: true, fullName: true } },
      room: { select: { id: true, roomNumber: true, roomType: true } },
    },
  });
}

export async function getAll() {
  return reservationRepository.findAll({
    orderBy: { createdAt: 'desc' },
    include: {
      guest: true,
      room: true,
      bookingAddons: { include: { addOn: true } },
      transaction: true,
    },
  });
}

export async function getById(id: string) {
  return reservationRepository.findById(id);
}

export async function createReservation(
  body: any,
  requestUserId?: string,
  socketSource?: string,
) {
  const { roomId, checkInDate, checkOutDate, ...otherData } = body;
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  // Only internal (staff) source may create historical (checked_out) reservations
  if (body.status === 'checked_out' && socketSource !== 'internal') {
    throw new AppError('Tidak diizinkan membuat reservasi dengan status ini', 403);
  }

  // Retry loop for serialization conflicts
  for (let attempt = 0; attempt <= TX_MAX_RETRIES; attempt++) {
    try {
      const data = await prisma.$transaction(async (tx) => {
        // 1. Validate input (room exists, dates valid, max stay)
        await validateBookingInput(roomId, checkIn, checkOut, tx, { allowPastDates: socketSource === 'internal' });

        // 2. Per-date availability check with stock support
        const { available, fullyBookedDates } = await checkRoomAvailability(roomId, checkIn, checkOut, tx);
        if (!available) {
          throw Object.assign(
            new AppError(`Maaf, kamar tidak tersedia pada tanggal: ${fullyBookedDates.join(', ')}`, 409),
            { fullyBookedDates },
          );
        }

        // 3. Calculate price server-side; honor client price for internal (offline) bookings
        const { totalPrice: computedPrice } = await calculateBookingPrice(roomId, checkIn, checkOut, tx);
        const clientPrice = Number(otherData.totalPrice) || 0;
        delete otherData.totalPrice;
        const finalPrice = socketSource === 'internal' && clientPrice > 0 ? clientPrice : computedPrice;

        // 4. Resolve guest and user IDs
        let guestIdToUse = otherData.guestId;
        let userIdToUse = otherData.userId || requestUserId;
        if (!userIdToUse) {
          const defaultUser = await tx.user.findFirst();
          userIdToUse = defaultUser?.id || 'missing-user';
        }

        delete otherData.guestId;
        delete otherData.userId;
        delete otherData.guest;
        delete otherData.room;
        delete otherData.user;
        delete otherData.channel;

        // 5. Set booking expiry ONLY for online bookings (non-internal).
        //    Internal/staff reservations are managed manually — they should never auto-expire.
        const initialStatus = (otherData as any).status;
        const isOnlineBooking = socketSource !== 'internal';
        const expiresAt = isOnlineBooking && (!initialStatus || initialStatus === 'pending')
          ? new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000)
          : null;

        const reservation = await tx.reservation.create({
          data: {
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalPrice: finalPrice,
            expiresAt,
            ...otherData,
            room: { connect: { id: roomId } },
            guest: { connect: { id: guestIdToUse } },
            user: { connect: { id: userIdToUse } },
          },
          include: {
            guest: { select: { id: true, fullName: true, phone: true } },
            room: { select: { id: true, roomNumber: true, roomType: true } },
            user: { select: { id: true, role: true, name: true } },
          },
        });

        // Auto-create Stay for historical (past) reservations so they appear in guest history
        if (initialStatus === 'checked_out') {
          await tx.stay.create({
            data: {
              reservationId: reservation.id,
              checkInAt: checkIn,
              checkOutAt: checkOut,
            },
          });
        }

        return reservation;
      }, {
        isolationLevel: 'Serializable',
        timeout: TX_TIMEOUT_MS,
      });

      logger.info('Reservation created', {
        reservationId: data.id,
        roomId,
        totalPrice: data.totalPrice,
        expiresAt: data.expiresAt,
      });

      // Emit socket events (outside transaction)
      try {
        const io = getIO();
        if (io) {
          io.emit('room_booked', { roomId, checkInDate, checkOutDate });
          io.emit('reservation_created', { ...data, source: socketSource ?? 'internal' });
        }
      } catch (e) {
        logger.error('Socket emit error', { error: e });
      }

      return data;
    } catch (error: any) {
      // Retry on serialization conflict
      if (error.code === 'P2034' && attempt < TX_MAX_RETRIES) {
        logger.warn('Serialization conflict, retrying', { roomId, attempt: attempt + 1 });
        continue;
      }
      throw error;
    }
  }
}

export async function updateReservation(id: string, body: any, requestUserId?: string) {
  const current = await reservationRepository.findById(id, {
    select: { id: true, status: true, totalPrice: true, userId: true },
  });
  if (!current) throw new AppError('Reservation not found', 404);

  const statusChanging = body?.status && body.status !== current.status;

  if (statusChanging) {
    const nextStatus = String(body.status);
    const allowed = ALLOWED_TRANSITIONS[current.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(`Transisi status tidak valid: ${current.status} -> ${nextStatus}`, 400);
    }
  }

  const linkedTx = statusChanging ? await transactionRepository.findByReservationId(id) : null;
  const newPaymentStatus = statusChanging && body.status
    ? resolvePaymentStatusFromReservation(body.status)
    : null;

  const now = new Date();
  const actingUserId = requestUserId ?? (current as any).userId ?? null;

  const { createdTx, data } = await dbRepository.transaction(async (tx) => {
    const updated = await reservationRepository.update(id, { data: body }, tx);
    let createdTx = null;

    if (newPaymentStatus === 'paid') {
      if (linkedTx) {
        // Update existing transaction
        if (linkedTx.paymentStatus !== 'paid') {
          await tx.transaction.update({
            where: { id: linkedTx.id },
            data: { paymentStatus: 'paid', paymentDate: linkedTx.paymentDate ?? now },
          });
        }
      } else {
        // Auto-create transaction since none exists
        createdTx = await tx.transaction.create({
          data: {
            reservationId: id,
            amount: (current as any).totalPrice,
            paymentStatus: 'paid',
            paymentMethod: 'cash',
            paymentDate: now,
          },
        });
      }
    }

    if (newPaymentStatus === 'cancelled') {
      if (linkedTx && linkedTx.paymentStatus !== 'cancelled') {
        await tx.transaction.update({
          where: { id: linkedTx.id },
          data: { paymentStatus: 'cancelled' },
        });
      }
    }

    return { createdTx, data: updated };
  });

  // Income side-effects outside transaction
  if (newPaymentStatus === 'paid') {
    const targetTx = createdTx ?? linkedTx;
    const wasAlreadyPaid = !createdTx && linkedTx?.paymentStatus === 'paid';
    if (targetTx && !wasAlreadyPaid) {
      await incomeRepository.create({
        data: {
          transactionId: targetTx.id,
          amount: targetTx.amount,
          description: buildIncomeDescriptionWithAddOns('Pembayaran Reservasi / Kamar (Dikonfirmasi)', (targetTx as any).notes ?? null),
          userId: actingUserId,
          incomeDate: (targetTx as any).paymentDate ?? now,
          sourceType: 'RESERVATION',
          referenceId: id,
          paymentMethod: targetTx.paymentMethod,
          status: 'paid',
          type: 'income',
        },
      });
    }
  }

  if (newPaymentStatus === 'cancelled' && linkedTx?.paymentStatus === 'paid') {
    await incomeRepository.deleteMany({ where: { transactionId: linkedTx.id } });
  }

  try {
    const io = getIO();
    io?.emit('reservation_updated', data);
    io?.emit('room_freed', { roomId: data.roomId });
  } catch (e) {}

  return data;
}

export async function deleteReservation(id: string) {
  await prisma.stay.deleteMany({ where: { reservationId: id } });
  const txRecord = await prisma.transaction.findUnique({ where: { reservationId: id } });
  if (txRecord) {
    await prisma.income.deleteMany({ where: { transactionId: txRecord.id } });
    await prisma.transaction.delete({ where: { id: txRecord.id } });
  }
  const data = await reservationRepository.delete(id);

  try {
    const io = getIO();
    io?.emit('reservation_deleted', { id: data.id });
    io?.emit('room_freed', { roomId: data.roomId });
  } catch (e) {}

  return data;
}

export interface AddAddOnInput {
  reservationId: string;
  addOnId: string;
  quantity: number;
  notes?: string;
  userId?: string | null;
}

export async function addReservationAddOn({
  reservationId,
  addOnId,
  quantity,
  notes = '',
  userId,
}: AddAddOnInput) {
  const result = await dbRepository.transaction(async (tx) => {
    const reservation = await reservationRepository.findById(reservationId, { include: {} }, tx);
    if (!reservation) throw new AppError('Reservation not found', 404);
    if (reservation.status !== ReservationStatus.checked_in && reservation.status !== ReservationStatus.checked_out) {
      throw new AppError('Add-On hanya dapat ditambahkan atau diubah untuk tamu yang statusnya check-in atau check-out', 400);
    }

    const addOn = await tx.addOn.findUnique({ where: { id: addOnId } });
    if (!addOn) throw new AppError('Add-On not found', 404);

    const totalPrice = Number(addOn.price) * quantity;
    const logLine = buildAddOnLogLine({ addOnName: addOn.name, quantity, totalPrice, notes });

    const existingAddOn = await tx.bookingAddOn.findFirst({
      where: { reservationId, addOnId }
    });

    let bookingAddOn;
    if (existingAddOn) {
      bookingAddOn = await tx.bookingAddOn.update({
        where: { id: existingAddOn.id },
        data: {
          quantity: { increment: quantity },
          totalPrice: { increment: totalPrice }
        },
        include: { addOn: true },
      });
    } else {
      bookingAddOn = await tx.bookingAddOn.create({
        data: { reservationId, addOnId, quantity, totalPrice },
        include: { addOn: true },
      });
    }

    if (userId) {
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ADD_ADDON',
          entity: 'Reservation',
          entityId: reservationId,
          newValues: { addOnName: addOn.name, quantity, totalPriceSnapshot: totalPrice },
        }
      });
    }

    // Append the formatted add-on log line to existing specialRequests (never overwrite)
    const updatedSpecialRequests = appendLine((reservation as any).specialRequests ?? undefined, logLine);
    await reservationRepository.update(reservationId, { data: { totalPrice: { increment: Math.floor(totalPrice) }, specialRequests: updatedSpecialRequests } }, tx);

    const trans = await tx.transaction.findUnique({ where: { reservationId } });
    if (trans) {
      const updatedTrans = await tx.transaction.update({
        where: { id: trans.id },
        data: {
          amount: { increment: totalPrice },
          notes: appendLine(trans.notes ?? undefined, logLine),
        },
      });

      if (trans.paymentStatus === 'paid') {
        await syncPaidTransactionIncomeForAddOn({
          tx,
          transactionId: trans.id,
          amountIncrement: totalPrice,
          addOnLogLine: logLine,
          userId: userId ?? null,
          paymentDate: updatedTrans.paymentDate,
        });
      }
    }

    return { bookingAddOn, totalPrice, addOnName: addOn.name, reservation };
  });

  try {
    const io = getIO();
    io?.emit('reservation_addon_added', {
      reservationId,
      addOnName: result.addOnName,
      quantity: result.bookingAddOn.quantity,
      totalPrice: result.totalPrice,
      notes,
      roomNumber: (result.reservation as any).room?.roomNumber,
      guestName: (result.reservation as any).guest?.fullName,
    });
  } catch (e) {}

  return result;
}

export async function removeReservationAddOn(reservationId: string, bookingAddOnId: string, userId?: string) {
  return await dbRepository.transaction(async (tx) => {
    const bookingAddOn = await tx.bookingAddOn.findUnique({
      where: { id: bookingAddOnId },
      include: { addOn: true, reservation: true }
    });
    
    if (!bookingAddOn || bookingAddOn.reservationId !== reservationId) {
      throw new AppError('Add-on tidak ditemukan pada reservasi ini', 404);
    }

    const { totalPrice } = bookingAddOn;

    // Remove the addon
    await tx.bookingAddOn.delete({ where: { id: bookingAddOnId } });

    // Decrease reservation total price
    await reservationRepository.update(reservationId, { data: { totalPrice: { decrement: totalPrice } } }, tx);

    // Update transaction if exists
    const trans = await tx.transaction.findUnique({ where: { reservationId } });
    if (trans) {
      const removalNote = `[DIHAPUS] ${bookingAddOn.addOn.name} (Qty: ${bookingAddOn.quantity}) - Rp${totalPrice}`;
      const newNotes = (trans.notes || '') + '\n' + removalNote;

      const updatedTrans = await tx.transaction.update({
        where: { id: trans.id },
        data: {
          amount: { decrement: totalPrice },
          notes: newNotes,
        }
      });

      if (trans.paymentStatus === 'paid') {
        await syncPaidTransactionIncomeForAddOn({
          tx,
          transactionId: trans.id,
          amountIncrement: -totalPrice,
          addOnLogLine: removalNote,
          userId: userId ?? null,
          paymentDate: updatedTrans.paymentDate,
        });
      }
    }

    if (userId) {
      await tx.auditLog.create({
        data: {
          userId,
          action: 'REMOVE_ADDON',
          entity: 'Reservation',
          entityId: reservationId,
          newValues: { addOnName: bookingAddOn.addOn.name, action: 'removed', amountRefunded: totalPrice }
        }
      });
    }

    const io = getIO();
    if (io) {
      io.emit('reservation_addon_removed', {
        reservationId,
        bookingAddOnId,
        totalRefund: totalPrice
      });
    }

    return bookingAddOn;
  });
}
