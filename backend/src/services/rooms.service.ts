import { checkRoomAvailability } from './pricing.service';
import { roomRepository } from '../repositories/room.repository';

export async function getRooms(status?: string, type?: string, checkIn?: string, checkOut?: string) {
  const rooms = await roomRepository.findAll({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(type ? { roomType: type as any } : {}),
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
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.roomNumber.localeCompare(b.roomNumber);
  });

  if (checkIn && checkOut) {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    
    // Attach isFullyBooked to each room based on genuine availability
    for (const room of rooms) {
      if (room.status === 'inactive' || room.status === 'maintenance') {
        (room as any).isFullyBooked = true;
        continue;
      }
      try {
        const availability = await checkRoomAvailability(room.id, inDate, outDate);
        (room as any).isFullyBooked = !availability.available;
      } catch (err) {
        (room as any).isFullyBooked = true;
      }
    }
  }

  return rooms;
}

export async function getRoomById(id: string) {
  return roomRepository.findById(id, {
    include: { roomAmenities: { include: { amenity: true } } },
  });
}

export interface CreateRoomInput {
  roomNumber: string;
  roomType?: string;
  floor?: number;
  capacity?: number;
  pricePerNight: number;
  description?: string;
  imageUrl?: string;
  selectedAmenities?: string[];
}

export async function createRoom(input: CreateRoomInput) {
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
  
  return roomRepository.create({ 
    data: {
      ...(roomData as any),
      ...(selectedAmenities && selectedAmenities.length > 0 ? {
        roomAmenities: {
          create: selectedAmenities.map((amenityId: string) => ({
            amenity: { connect: { id: amenityId } }
          }))
        }
      } : {})
    }
  });
}

export async function updateRoom(
  id: string,
  fields: {
    roomNumber?: string;
    roomType?: string;
    floor?: number;
    capacity?: number;
    pricePerNight?: number;
    description?: string;
    imageUrl?: string;
    status?: string;
    selectedAmenities?: string[];
  },
) {
  if (fields.pricePerNight !== undefined && Number(fields.pricePerNight) <= 0) {
    throw Object.assign(new Error('Harga kamar harus lebih dari 0'), { statusCode: 400 });
  }
  if (fields.capacity !== undefined && Number(fields.capacity) <= 0) {
    throw Object.assign(new Error('Kapasitas kamar harus lebih dari 0'), { statusCode: 400 });
  }

  const { selectedAmenities, ...roomData } = fields;

  if (selectedAmenities !== undefined) {
    return roomRepository.update(id, {
      data: {
        ...(roomData as any),
        roomAmenities: {
          deleteMany: {},
          create: selectedAmenities.map((amenityId: string) => ({
            amenity: { connect: { id: amenityId } }
          }))
        }
      }
    });
  }

  return roomRepository.update(id, { data: roomData as any });
}

export async function deleteRoom(id: string) {
  await roomRepository.delete(id);
}
