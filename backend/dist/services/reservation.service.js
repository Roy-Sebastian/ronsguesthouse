"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReminders = getReminders;
exports.getAll = getAll;
exports.getById = getById;
exports.createReservation = createReservation;
exports.updateReservation = updateReservation;
exports.deleteReservation = deleteReservation;
exports.addReservationAddOn = addReservationAddOn;
exports.removeReservationAddOn = removeReservationAddOn;
const client_1 = require("@prisma/client");
const pricing_service_1 = require("./pricing.service");
const logger_1 = require("../config/logger");
const prisma_1 = require("../config/prisma");
const socket_1 = require("../config/socket");
const reservation_constants_1 = require("../constants/reservation.constants");
const db_repository_1 = require("../repositories/db.repository");
const reservation_repository_1 = require("../repositories/reservation.repository");
const utils_1 = require("../utils");
const utils_2 = require("../utils");
const AppError_1 = require("../utils/AppError");
async function getReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    return reservation_repository_1.reservationRepository.findAll({
        where: {
            checkInDate: { gte: tomorrow, lt: dayAfterTomorrow },
            status: { in: [client_1.ReservationStatus.pending, client_1.ReservationStatus.confirmed] },
        },
        include: {
            guest: { select: { fullName: true, phone: true } },
            room: { select: { roomNumber: true } },
        },
        orderBy: { checkInDate: 'asc' },
    });
}
async function getAll() {
    return reservation_repository_1.reservationRepository.findAll({
        orderBy: { createdAt: 'desc' },
        include: {
            guest: true,
            room: true,
            bookingAddons: { include: { addOn: true } },
            transaction: true,
        },
    });
}
async function getById(id) {
    return reservation_repository_1.reservationRepository.findById(id);
}
async function createReservation(body, requestUserId, socketSource) {
    const { roomId, checkInDate, checkOutDate, ...otherData } = body;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    // Retry loop for serialization conflicts
    for (let attempt = 0; attempt <= reservation_constants_1.TX_MAX_RETRIES; attempt++) {
        try {
            const data = await prisma_1.prisma.$transaction(async (tx) => {
                // 1. Validate input (room exists, dates valid, max stay)
                await (0, pricing_service_1.validateBookingInput)(roomId, checkIn, checkOut, tx);
                // 2. Per-date availability check with stock support
                const { available, fullyBookedDates } = await (0, pricing_service_1.checkRoomAvailability)(roomId, checkIn, checkOut, tx);
                if (!available) {
                    throw Object.assign(new AppError_1.AppError(`Maaf, kamar tidak tersedia pada tanggal: ${fullyBookedDates.join(', ')}`, 409), { fullyBookedDates });
                }
                // 3. Calculate price server-side (ignores client-supplied totalPrice)
                const { totalPrice: computedPrice } = await (0, pricing_service_1.calculateBookingPrice)(roomId, checkIn, checkOut, tx);
                delete otherData.totalPrice;
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
                // 5. Set booking expiry for pending reservations
                const expiresAt = new Date(Date.now() + reservation_constants_1.BOOKING_EXPIRY_MINUTES * 60 * 1000);
                return await tx.reservation.create({
                    data: {
                        checkInDate: checkIn,
                        checkOutDate: checkOut,
                        totalPrice: computedPrice,
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
            }, {
                isolationLevel: 'Serializable',
                timeout: reservation_constants_1.TX_TIMEOUT_MS,
            });
            logger_1.logger.info('Reservation created', {
                reservationId: data.id,
                roomId,
                totalPrice: data.totalPrice,
                expiresAt: data.expiresAt,
            });
            // Emit socket events (outside transaction)
            try {
                const io = (0, socket_1.getIO)();
                if (io) {
                    io.emit('room_booked', { roomId, checkInDate, checkOutDate });
                    io.emit('reservation_created', { ...data, source: socketSource ?? 'internal' });
                }
            }
            catch (e) {
                logger_1.logger.error('Socket emit error', { error: e });
            }
            return data;
        }
        catch (error) {
            // Retry on serialization conflict
            if (error.code === 'P2034' && attempt < reservation_constants_1.TX_MAX_RETRIES) {
                logger_1.logger.warn('Serialization conflict, retrying', { roomId, attempt: attempt + 1 });
                continue;
            }
            throw error;
        }
    }
}
async function updateReservation(id, body) {
    const current = await reservation_repository_1.reservationRepository.findById(id, { select: { id: true, status: true } });
    if (!current) {
        throw new AppError_1.AppError('Reservation not found', 404);
    }
    if (body?.status) {
        const nextStatus = String(body.status);
        const allowed = reservation_constants_1.ALLOWED_TRANSITIONS[current.status] || [];
        if (!allowed.includes(nextStatus)) {
            throw new AppError_1.AppError(`Transisi status tidak valid: ${current.status} -> ${nextStatus}`, 400);
        }
    }
    const data = await reservation_repository_1.reservationRepository.update(id, { data: body });
    try {
        const io = (0, socket_1.getIO)();
        io.emit('reservation_updated', data);
        io.emit('room_freed', { roomId: data.roomId });
    }
    catch (e) { }
    return data;
}
async function deleteReservation(id) {
    await prisma_1.prisma.stay.deleteMany({ where: { reservationId: id } });
    const txRecord = await prisma_1.prisma.transaction.findUnique({ where: { reservationId: id } });
    if (txRecord) {
        await prisma_1.prisma.income.deleteMany({ where: { transactionId: txRecord.id } });
        await prisma_1.prisma.transaction.delete({ where: { id: txRecord.id } });
    }
    const data = await reservation_repository_1.reservationRepository.delete(id);
    try {
        const io = (0, socket_1.getIO)();
        io.emit('reservation_deleted', { id: data.id });
        io.emit('room_freed', { roomId: data.roomId });
    }
    catch (e) { }
    return data;
}
async function addReservationAddOn({ reservationId, addOnId, quantity, notes = '', userId, }) {
    const result = await db_repository_1.dbRepository.transaction(async (tx) => {
        const reservation = await reservation_repository_1.reservationRepository.findById(reservationId, { include: {} }, tx);
        if (!reservation)
            throw new AppError_1.AppError('Reservation not found', 404);
        if (reservation.status !== client_1.ReservationStatus.checked_in && reservation.status !== client_1.ReservationStatus.checked_out) {
            throw new AppError_1.AppError('Add-On hanya dapat ditambahkan atau diubah untuk tamu yang statusnya check-in atau check-out', 400);
        }
        const addOn = await tx.addOn.findUnique({ where: { id: addOnId } });
        if (!addOn)
            throw new AppError_1.AppError('Add-On not found', 404);
        const totalPrice = Number(addOn.price) * quantity;
        const logLine = (0, utils_2.buildAddOnLogLine)({ addOnName: addOn.name, quantity, totalPrice, notes });
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
        }
        else {
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
        const updatedSpecialRequests = (0, utils_2.appendLine)(reservation.specialRequests ?? undefined, logLine);
        await reservation_repository_1.reservationRepository.update(reservationId, { data: { totalPrice: { increment: Math.floor(totalPrice) }, specialRequests: updatedSpecialRequests } }, tx);
        const trans = await tx.transaction.findUnique({ where: { reservationId } });
        if (trans) {
            const updatedTrans = await tx.transaction.update({
                where: { id: trans.id },
                data: {
                    amount: { increment: totalPrice },
                    notes: (0, utils_2.appendLine)(trans.notes ?? undefined, logLine),
                },
            });
            if (trans.paymentStatus === 'paid') {
                await (0, utils_1.syncPaidTransactionIncomeForAddOn)({
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
        const io = (0, socket_1.getIO)();
        io.emit('reservation_addon_added', {
            reservationId,
            addOnName: result.addOnName,
            quantity: result.bookingAddOn.quantity,
            totalPrice: result.totalPrice,
            notes,
            roomNumber: result.reservation.room?.roomNumber,
            guestName: result.reservation.guest?.fullName,
        });
    }
    catch (e) { }
    return result;
}
async function removeReservationAddOn(reservationId, bookingAddOnId, userId) {
    return await db_repository_1.dbRepository.transaction(async (tx) => {
        const bookingAddOn = await tx.bookingAddOn.findUnique({
            where: { id: bookingAddOnId },
            include: { addOn: true, reservation: true }
        });
        if (!bookingAddOn || bookingAddOn.reservationId !== reservationId) {
            throw new AppError_1.AppError('Add-on tidak ditemukan pada reservasi ini', 404);
        }
        const { totalPrice } = bookingAddOn;
        // Remove the addon
        await tx.bookingAddOn.delete({ where: { id: bookingAddOnId } });
        // Decrease reservation total price
        await reservation_repository_1.reservationRepository.update(reservationId, { data: { totalPrice: { decrement: totalPrice } } }, tx);
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
                await (0, utils_1.syncPaidTransactionIncomeForAddOn)({
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
        const io = (0, socket_1.getIO)();
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
