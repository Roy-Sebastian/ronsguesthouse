import { incomeRepository } from '../repositories/income.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { buildIncomeDescriptionWithAddOns, extractAddOnLines } from '../utils';

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

  const data = await transactionRepository.create({
    data: payload,
    include: WITH_RESERVATION,
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

  const data = await transactionRepository.update(id, {
    data: payload,
    include: WITH_RESERVATION,
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

  return data;
}

export async function deleteTransaction(id: string) {
  await transactionRepository.delete(id);
}
