import { getIO } from '../config/socket';
import { dbRepository } from '../repositories/db.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { stayRepository } from '../repositories/stay.repository';

export async function getAllStays(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  dateStart?: string,
  dateEnd?: string,
) {
  const skip = (page - 1) * limit;

  let whereClause: any = {};
  if (status === 'checked_out') {
    whereClause.checkOutAt = { not: null };
  } else if (status === 'checked_in') {
    whereClause.checkOutAt = null;
  }

  if (dateStart || dateEnd) {
    whereClause.checkInAt = {
      ...(dateStart ? { gte: new Date(dateStart + 'T00:00:00') } : {}),
      ...(dateEnd ? { lte: new Date(dateEnd + 'T23:59:59') } : {}),
    };
  }

  if (search) {
    whereClause.OR = [
      { reservation: { guest: { fullName: { contains: search, mode: 'insensitive' } } } },
      { reservation: { room: { roomNumber: { contains: search, mode: 'insensitive' } } } }
    ];
  }

  const [data, total] = await Promise.all([
    stayRepository.findAll({
      where: whereClause,
      include: {
        reservation: {
          include: {
            guest: true,
            room: true,
            bookingAddons: { include: { addOn: true } },
            penalties: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    stayRepository.count({ where: whereClause }),
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

export async function getStayById(id: string) {
  return stayRepository.findById(id, {
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

export async function createStay(reservationId: string, notes?: string) {
  const result = await dbRepository.transaction(async (tx) => {
    const reservation = await reservationRepository.findById(reservationId, { select: { status: true } }, tx);
    if (!reservation) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
    if (reservation.status !== 'confirmed') {
      throw Object.assign(
        new Error('Check-in hanya bisa dilakukan untuk reservasi berstatus confirmed'),
        { statusCode: 400 },
      );
    }

    const data = await stayRepository.create({
      data: { reservationId, notes, checkInAt: new Date() },
    }, tx);

    await reservationRepository.update(reservationId, { data: { status: 'checked_in' } }, tx);

    return data;
  });

  try {
    const io = getIO();
    io?.emit('reservation_updated', { id: reservationId, status: 'checked_in' });
  } catch (e) {}

  return result;
}

export async function updateStay(id: string, body: any) {
  const result = await dbRepository.transaction(async (tx) => {
    const { action, ...otherData } = body;
    let updateData: any = { ...otherData };

    const existingStay = await stayRepository.findById(id, { select: { id: true, checkOutAt: true, reservationId: true } }, tx);
    if (!existingStay) throw Object.assign(new Error('Stay not found'), { statusCode: 404 });

    if (action === 'checkout') {
      if (existingStay.checkOutAt) {
        throw Object.assign(new Error('Tamu sudah checkout sebelumnya'), { statusCode: 400 });
      }
      updateData.checkOutAt = new Date();
    }

    const data = await stayRepository.update(id, { data: updateData }, tx);

    if (action === 'checkout') {
      await reservationRepository.update(data.reservationId, { data: { status: 'checked_out' } }, tx);
    }

    return data;
  });

  try {
    const io = getIO();
    io?.emit('reservation_updated', { id: result.reservationId, status: body.action === 'checkout' ? 'checked_out' : undefined });
  } catch (e) {}

  return result;
}

export async function deleteStay(id: string) {
  const existingStay = await stayRepository.findById(id, { select: { reservationId: true } });
  await stayRepository.delete(id);
  if (existingStay) {
    try {
      const io = getIO();
      io?.emit('reservation_updated', { id: existingStay.reservationId });
    } catch (e) {}
  }
}
