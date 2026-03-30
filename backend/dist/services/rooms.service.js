"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRooms = getRooms;
exports.getRoomById = getRoomById;
exports.createRoom = createRoom;
exports.updateRoom = updateRoom;
exports.deleteRoom = deleteRoom;
const room_repository_1 = require("../repositories/room.repository");
const pricing_service_1 = require("./pricing.service");
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
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
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
        throw Object.assign(new Error('Missing required fields'), { statusCode: 400 });
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
