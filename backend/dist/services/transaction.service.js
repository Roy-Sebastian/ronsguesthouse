"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTransactions = getAllTransactions;
exports.getTransactionById = getTransactionById;
exports.createTransaction = createTransaction;
exports.updateTransaction = updateTransaction;
exports.deleteTransaction = deleteTransaction;
const income_repository_1 = require("../repositories/income.repository");
const reservation_repository_1 = require("../repositories/reservation.repository");
const transaction_repository_1 = require("../repositories/transaction.repository");
const utils_1 = require("../utils");
const WITH_RESERVATION = {
    reservation: {
        include: {
            guest: { select: { fullName: true } },
            room: { select: { roomNumber: true } },
            bookingAddons: {
                include: {
                    addOn: { select: { name: true, price: true } },
                },
            },
        },
    },
};
async function getAllTransactions() {
    return transaction_repository_1.transactionRepository.findAll({
        orderBy: { createdAt: 'desc' },
        include: WITH_RESERVATION,
    });
}
async function getTransactionById(id) {
    return transaction_repository_1.transactionRepository.findById(id, { include: WITH_RESERVATION });
}
async function createTransaction(body, userId) {
    const { referenceId, ...rest } = body;
    const payload = { ...rest };
    if (referenceId) {
        payload.notes = payload.notes
            ? `${payload.notes}\nRef: ${referenceId}`
            : `Ref: ${referenceId}`;
    }
    if (!payload.reservationId) {
        throw Object.assign(new Error('reservationId wajib diisi'), { statusCode: 400 });
    }
    const amountNum = Number(payload.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
        throw Object.assign(new Error('Jumlah pembayaran harus lebih dari 0'), { statusCode: 400 });
    }
    if (payload.paymentStatus === 'paid' && !payload.paymentDate) {
        payload.paymentDate = new Date();
    }
    if (payload.reservationId && !payload.notes) {
        const reservation = await reservation_repository_1.reservationRepository.findById(String(payload.reservationId), {
            select: { specialRequests: true },
        });
        const addonLines = (0, utils_1.extractAddOnLines)(reservation?.specialRequests);
        if (addonLines.length > 0) {
            payload.notes = addonLines.join('\n');
        }
    }
    const data = await transaction_repository_1.transactionRepository.create({
        data: payload,
        include: WITH_RESERVATION,
    });
    if (data.paymentStatus === 'paid') {
        await income_repository_1.incomeRepository.create({
            data: {
                transactionId: data.id,
                amount: data.amount,
                description: (0, utils_1.buildIncomeDescriptionWithAddOns)('Pembayaran Reservasi / Kamar (Walk-in/Manual)', payload.notes),
                userId: userId ?? null,
                incomeDate: data.paymentDate || new Date(),
                sourceType: 'RESERVATION',
                referenceId: data.reservationId,
                paymentMethod: data.paymentMethod,
                status: 'paid',
                guestNameSnapshot: data.reservation?.guest?.fullName,
                roomNumberSnapshot: data.reservation?.room?.roomNumber,
                type: 'income',
            },
        });
    }
    return data;
}
async function updateTransaction(id, body, userId) {
    const oldTx = await transaction_repository_1.transactionRepository.findById(id);
    const payload = { ...body };
    if (payload.paymentStatus === 'paid' && !payload.paymentDate) {
        payload.paymentDate = new Date();
    }
    const data = await transaction_repository_1.transactionRepository.update(id, {
        data: payload,
        include: WITH_RESERVATION,
    });
    if (oldTx && oldTx.paymentStatus !== 'paid' && data.paymentStatus === 'paid') {
        await income_repository_1.incomeRepository.create({
            data: {
                transactionId: data.id,
                amount: data.amount,
                description: (0, utils_1.buildIncomeDescriptionWithAddOns)('Pembayaran Reservasi / Kamar (Dilunasi)', data.notes),
                userId: userId ?? null,
                incomeDate: data.paymentDate || new Date(),
                sourceType: 'RESERVATION',
                referenceId: data.reservationId,
                paymentMethod: data.paymentMethod,
                status: 'paid',
                guestNameSnapshot: data.reservation?.guest?.fullName,
                roomNumberSnapshot: data.reservation?.room?.roomNumber,
                type: 'income',
            },
        });
    }
    if (oldTx && oldTx.paymentStatus === 'paid' && data.paymentStatus !== 'paid') {
        await income_repository_1.incomeRepository.deleteMany({ where: { transactionId: data.id } });
    }
    return data;
}
async function deleteTransaction(id) {
    await transaction_repository_1.transactionRepository.delete(id);
}
