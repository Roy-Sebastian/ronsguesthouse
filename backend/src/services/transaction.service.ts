import { ReservationStatus } from '@prisma/client';
import { dbRepository } from '../repositories/db.repository';
import { incomeRepository } from '../repositories/income.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { buildIncomeDescriptionWithAddOns, extractAddOnLines } from '../utils';
import { getIO } from '../config/socket';

/** Derive new reservation status from payment status change */
function resolveReservationStatus(
  paymentStatus: string,
  currentReservationStatus: string,
): ReservationStatus | null {
  if (paymentStatus === 'paid' && currentReservationStatus === ReservationStatus.pending) {
    return ReservationStatus.confirmed;
  }
  if (
    (paymentStatus === 'cancelled' || paymentStatus === 'refunded') &&
    currentReservationStatus === ReservationStatus.confirmed
  ) {
    return ReservationStatus.pending;
  }
  return null;
}

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
} as const;

export async function getAllTransactions() {
  return transactionRepository.findAll({
    orderBy: { createdAt: 'desc' },
    include: WITH_RESERVATION,
  });
}

export async function getTransactionById(id: string) {
  return transactionRepository.findById(id, { include: WITH_RESERVATION });
}

export async function createTransaction(
  body: any,
  userId?: string | null,
) {
  const { referenceId, ...rest } = body;
  const payload: any = { ...rest };
  if (!payload.paymentStatus) {
    payload.paymentStatus = 'paid';
  }
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
    const reservation = await reservationRepository.findById(String(payload.reservationId), {
      select: { specialRequests: true },
    });
    const addonLines = extractAddOnLines(reservation?.specialRequests);
    if (addonLines.length > 0) {
      payload.notes = addonLines.join('\n');
    }
  }

  const data = await dbRepository.transaction(async (tx) => {
    const created = await transactionRepository.create({
      data: payload,
      include: WITH_RESERVATION,
    }, tx);

    if (created.reservationId) {
      const reservation = await reservationRepository.findById(String(created.reservationId), {}, tx);
      const newStatus = reservation ? resolveReservationStatus(created.paymentStatus, reservation.status) : null;
      if (newStatus) {
        await reservationRepository.update(String(created.reservationId), { data: { status: newStatus } }, tx);
      }
    }

    return created;
  });

  if (data.paymentStatus === 'paid') {
    await incomeRepository.create({
      data: {
        transactionId: data.id,
        amount: data.amount,
        description: buildIncomeDescriptionWithAddOns(
          'Pembayaran Reservasi / Kamar (Walk-in/Manual)',
          payload.notes,
        ),
        userId: userId ?? null,
        incomeDate: data.paymentDate || new Date(),
        sourceType: 'RESERVATION',
        referenceId: data.reservationId,
        paymentMethod: data.paymentMethod,
        status: 'paid',
        guestNameSnapshot: (data as any).reservation?.guest?.fullName,
        roomNumberSnapshot: (data as any).reservation?.room?.roomNumber,
        type: 'income',
      },
    });
  }

  if (data.reservationId) {
    try {
      const io = getIO();
      io?.emit('reservation_updated', { id: data.reservationId });
    } catch (e) {}
  }

  return data;
}

export async function updateTransaction(
  id: string,
  body: any,
  userId?: string | null,
) {
  const oldTx = await transactionRepository.findById(id);
  const payload = { ...body };
  if (payload.paymentStatus === 'paid' && !payload.paymentDate) {
    payload.paymentDate = new Date();
  }

  const data = await dbRepository.transaction(async (tx) => {
    const updated = await transactionRepository.update(id, {
      data: payload,
      include: WITH_RESERVATION,
    }, tx);

    if (oldTx && updated.reservationId && oldTx.paymentStatus !== updated.paymentStatus) {
      const reservation = await reservationRepository.findById(String(updated.reservationId), {}, tx);
      const newStatus = reservation ? resolveReservationStatus(updated.paymentStatus, reservation.status) : null;
      if (newStatus) {
        await reservationRepository.update(String(updated.reservationId), { data: { status: newStatus } }, tx);
      }
    }

    return updated;
  });

  if (oldTx && oldTx.paymentStatus !== 'paid' && data.paymentStatus === 'paid') {
    await incomeRepository.create({
      data: {
        transactionId: data.id,
        amount: data.amount,
        description: buildIncomeDescriptionWithAddOns(
          'Pembayaran Reservasi / Kamar (Dilunasi)',
          data.notes,
        ),
        userId: userId ?? null,
        incomeDate: data.paymentDate || new Date(),
        sourceType: 'RESERVATION',
        referenceId: data.reservationId,
        paymentMethod: data.paymentMethod,
        status: 'paid',
        guestNameSnapshot: (data as any).reservation?.guest?.fullName,
        roomNumberSnapshot: (data as any).reservation?.room?.roomNumber,
        type: 'income',
      },
    });
  }

  if (oldTx && oldTx.paymentStatus === 'paid' && data.paymentStatus !== 'paid') {
    await incomeRepository.deleteMany({ where: { transactionId: data.id } });
  }

  if (data.reservationId) {
    try {
      const io = getIO();
      io?.emit('reservation_updated', { id: data.reservationId });
    } catch (e) {}
  }

  return data;
}

export async function deleteTransaction(id: string) {
  const oldTx = await transactionRepository.findById(id, { select: { reservationId: true } });
  await transactionRepository.delete(id);
  if (oldTx?.reservationId) {
    try {
      const io = getIO();
      io?.emit('reservation_updated', { id: oldTx.reservationId });
    } catch (e) {}
  }
}
