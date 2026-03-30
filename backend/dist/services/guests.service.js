"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllGuests = getAllGuests;
exports.getGuestById = getGuestById;
exports.createGuest = createGuest;
exports.updateGuest = updateGuest;
exports.deleteGuest = deleteGuest;
const socket_1 = require("../config/socket");
const db_repository_1 = require("../repositories/db.repository");
const guest_repository_1 = require("../repositories/guest.repository");
const reservation_repository_1 = require("../repositories/reservation.repository");
const stay_repository_1 = require("../repositories/stay.repository");
const transaction_repository_1 = require("../repositories/transaction.repository");
const user_repository_1 = require("../repositories/user.repository");
async function getAllGuests() {
    return guest_repository_1.guestRepository.findAll({ orderBy: { createdAt: 'desc' } });
}
async function getGuestById(id) {
    return guest_repository_1.guestRepository.findById(id);
}
async function createGuest(input) {
    const { category, roomId, checkInDate, checkOutDate, paymentMethod, amount, deposit, notes, userId, fullName, idNumber, phone, email, address, nationality, dateOfBirth, gender, previousLocation, nextDestination, purposeOfVisit, signature, passportNo, } = input;
    const result = await db_repository_1.dbRepository.transaction(async (tx) => {
        const identity = category === 'Lokal'
            ? idNumber || `LOCAL-${Date.now()}`
            : passportNo || idNumber || `INTL-${Date.now()}`;
        const guest = await guest_repository_1.guestRepository.create({
            data: {
                fullName,
                idNumber: identity,
                phone: phone || '000000',
                email,
                address,
                nationality: category === 'Lokal' ? 'Indonesia' : nationality || 'Unknown',
                category: category || 'Lokal',
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
                previousLocation,
                nextDestination,
                purposeOfVisit,
                signature,
            },
        }, tx);
        if (roomId) {
            let fallbackUser = userId;
            if (!fallbackUser) {
                const firstUsers = await user_repository_1.userRepository.findAll({ take: 1 }, tx);
                if (firstUsers.length > 0)
                    fallbackUser = firstUsers[0].id;
            }
            const cin = checkInDate ? new Date(checkInDate) : new Date();
            const cout = checkOutDate
                ? new Date(checkOutDate)
                : new Date(Date.now() + 86400000);
            const resv = await reservation_repository_1.reservationRepository.create({
                data: {
                    guestId: guest.id,
                    roomId,
                    userId: fallbackUser,
                    checkInDate: cin,
                    checkOutDate: cout,
                    status: 'checked_in',
                    totalPrice: amount ? Number(amount) : 0,
                    specialRequests: notes,
                },
            }, tx);
            await stay_repository_1.stayRepository.create({
                data: {
                    reservationId: resv.id,
                    checkInAt: new Date(),
                    notes: deposit ? `Deposit: ${deposit}. ${notes || ''}` : notes,
                },
            }, tx);
            let mappedPaymentMethod = 'cash';
            if (paymentMethod === 'transfer' || paymentMethod === 'aplikasi')
                mappedPaymentMethod = 'transfer';
            await transaction_repository_1.transactionRepository.create({
                data: {
                    reservationId: resv.id,
                    amount: amount ? Number(amount) : 0,
                    paymentMethod: mappedPaymentMethod,
                    notes: deposit ? `Deposit: ${deposit}` : '',
                    paymentStatus: 'paid',
                },
            }, tx);
            try {
                const io = (0, socket_1.getIO)();
                if (io) {
                    io.emit('room_booked', { roomId, checkInDate: cin, checkOutDate: cout });
                }
            }
            catch (e) { }
        }
        return guest;
    });
    return result;
}
async function updateGuest(id, data) {
    return guest_repository_1.guestRepository.update(id, { data });
}
async function deleteGuest(id) {
    await guest_repository_1.guestRepository.delete(id);
}
