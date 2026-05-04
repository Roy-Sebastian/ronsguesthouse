"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRooms = getRooms;
exports.getRoomById = getRoomById;
exports.createRoom = createRoom;
exports.updateRoom = updateRoom;
exports.deleteRoom = deleteRoom;
const pricing_service_1 = require("./pricing.service");
const room_repository_1 = require("../repositories/room.repository");
async function getRooms(status, type, checkIn, checkOut) {
    const rooms = await room_repository_1.roomRepository.findAll({
        where: {
            ...(status ? { status: status } : {}),
            ...(type ? { roomType: type } : {}),
        },
        include: {
            roomAmenities: { include: { amenity: true } },
            _count: { select: { reservations: true } },
        },
        orderBy: [{ floor: 'asc' }],
    });
    rooms.sort((a, b) => {
        const aNum = parseInt(a.roomNumber, 10);
        const bNum = parseInt(b.roomNumber, 10);
        if (!isNaN(aNum) && !isNaN(bNum))
            return aNum - bNum;
        return a.roomNumber.localeCompare(b.roomNumber);
    });
    if (checkIn && checkOut) {
        const inDate = new Date(checkIn);
        const outDate = new Date(checkOut);
        // Attach isFullyBooked to each room based on genuine availability
        for (const room of rooms) {
            if (room.status === 'inactive' || room.status === 'maintenance') {
                room.isFullyBooked = true;
                continue;
            }
            try {
                const availability = await (0, pricing_service_1.checkRoomAvailability)(room.id, inDate, outDate);
                room.isFullyBooked = !availability.available;
            }
            catch (err) {
                room.isFullyBooked = true;
            }
        }
    }
    return rooms;
}
async function getRoomById(id) {
    return room_repository_1.roomRepository.findById(id, {
        include: { roomAmenities: { include: { amenity: true } } },
    });
}
async function createRoom(input) {
    if (!input.roomNumber || !input.pricePerNight) {
        throw Object.assign(new Error('Nomor kamar dan harga wajib diisi'), { statusCode: 400 });
    }
    if (Number(input.pricePerNight) <= 0) {
        throw Object.assign(new Error('Harga kamar harus lebih dari 0'), { statusCode: 400 });
    }
    if (input.capacity !== undefined && Number(input.capacity) <= 0) {
        throw Object.assign(new Error('Kapasitas kamar harus lebih dari 0'), { statusCode: 400 });
    }
    const { selectedAmenities, ...roomData } = input;
    return room_repository_1.roomRepository.create({
        data: {
            ...roomData,
            ...(selectedAmenities && selectedAmenities.length > 0 ? {
                roomAmenities: {
                    create: selectedAmenities.map((amenityId) => ({
                        amenity: { connect: { id: amenityId } }
                    }))
                }
            } : {})
        }
    });
}
async function updateRoom(id, fields) {
    if (fields.pricePerNight !== undefined && Number(fields.pricePerNight) <= 0) {
        throw Object.assign(new Error('Harga kamar harus lebih dari 0'), { statusCode: 400 });
    }
    if (fields.capacity !== undefined && Number(fields.capacity) <= 0) {
        throw Object.assign(new Error('Kapasitas kamar harus lebih dari 0'), { statusCode: 400 });
    }
    const { selectedAmenities, ...roomData } = fields;
    if (selectedAmenities !== undefined) {
        return room_repository_1.roomRepository.update(id, {
            data: {
                ...roomData,
                roomAmenities: {
                    deleteMany: {},
                    create: selectedAmenities.map((amenityId) => ({
                        amenity: { connect: { id: amenityId } }
                    }))
                }
            }
        });
    }
    return room_repository_1.roomRepository.update(id, { data: roomData });
}
async function deleteRoom(id) {
    await room_repository_1.roomRepository.delete(id);
}
