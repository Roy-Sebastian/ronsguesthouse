"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStays = getAllStays;
exports.getStayById = getStayById;
exports.createStay = createStay;
exports.updateStay = updateStay;
exports.deleteStay = deleteStay;
const db_repository_1 = require("../repositories/db.repository");
const reservation_repository_1 = require("../repositories/reservation.repository");
const stay_repository_1 = require("../repositories/stay.repository");
async function getAllStays(page = 1, limit = 10, search, status) {
    const skip = (page - 1) * limit;
    let whereClause = {};
    if (status === 'checked_out') {
        whereClause.checkOutAt = { not: null };
    }
    else if (status === 'checked_in') {
        whereClause.checkOutAt = null;
    }
    if (search) {
        whereClause.OR = [
            { reservation: { guest: { fullName: { contains: search, mode: 'insensitive' } } } },
            { reservation: { room: { roomNumber: { contains: search, mode: 'insensitive' } } } }
        ];
    }
    const [data, total] = await Promise.all([
        stay_repository_1.stayRepository.findAll({
            where: whereClause,
            include: {
                reservation: {
                    include: {
                        guest: true,
                        room: true,
                        bookingAddons: { include: { addOn: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        stay_repository_1.stayRepository.count({ where: whereClause }),
    ]);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}
async function getStayById(id) {
    return stay_repository_1.stayRepository.findById(id, {
        include: {
            reservation: {
                include: {
                    guest: true,
                    room: true,
                    bookingAddons: { include: { addOn: true } },
                },
            },
        },
    });
}
async function createStay(reservationId, notes) {
    return db_repository_1.dbRepository.transaction(async (tx) => {
        const reservation = await reservation_repository_1.reservationRepository.findById(reservationId, { select: { status: true } }, tx);
        if (!reservation)
            throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
        if (reservation.status !== 'confirmed') {
            throw Object.assign(new Error('Check-in hanya bisa dilakukan untuk reservasi berstatus confirmed'), { statusCode: 400 });
        }
        const data = await stay_repository_1.stayRepository.create({
            data: { reservationId, notes, checkInAt: new Date() },
        }, tx);
        await reservation_repository_1.reservationRepository.update(reservationId, { data: { status: 'checked_in' } }, tx);
        return data;
    });
}
async function updateStay(id, body) {
    return db_repository_1.dbRepository.transaction(async (tx) => {
        const { action, ...otherData } = body;
        let updateData = { ...otherData };
        const existingStay = await stay_repository_1.stayRepository.findById(id, { select: { id: true, checkOutAt: true, reservationId: true } }, tx);
        if (!existingStay)
            throw Object.assign(new Error('Stay not found'), { statusCode: 404 });
        if (action === 'checkout') {
            if (existingStay.checkOutAt) {
                throw Object.assign(new Error('Tamu sudah checkout sebelumnya'), { statusCode: 400 });
            }
            updateData.checkOutAt = new Date();
        }
        const data = await stay_repository_1.stayRepository.update(id, { data: updateData }, tx);
        if (action === 'checkout') {
            await reservation_repository_1.reservationRepository.update(data.reservationId, { data: { status: 'checked_out' } }, tx);
        }
        return data;
    });
}
async function deleteStay(id) {
    await stay_repository_1.stayRepository.delete(id);
}
