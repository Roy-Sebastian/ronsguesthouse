import { Prisma } from '@prisma/client';

import { dbRepository } from '../repositories/db.repository';
import { incomeRepository } from '../repositories/income.repository';
import { penaltyRepository } from '../repositories/penalty.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { transactionRepository } from '../repositories/transaction.repository';

const PENALTY_LABEL: Record<string, string> = {
  late_checkout: 'Denda Keterlambatan Checkout',
  room_damage: 'Denda Kerusakan Kamar',
  missing_items: 'Denda Barang Hilang',
  other: 'Denda Lainnya',
};

const WITH_RESERVATION = {
  reservation: {
    include: {
      guest: { select: { fullName: true } },
      room: { select: { roomNumber: true, roomType: true } },
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

type PenaltyInput = {
  reservationId: string;
  type?: string;
  amount: number | string;
  description: string;
  notes?: string | null;
  status?: string;
};

const toDecimal = (value: number | string | Prisma.Decimal): Prisma.Decimal =>
  new Prisma.Decimal(value as any);

export async function getAllPenalties(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  reservationId?: string,
) {
  const skip = (page - 1) * limit;

  const whereClause: Prisma.PenaltyWhereInput = {};
  if (status && ['pending', 'paid', 'waived'].includes(status)) {
    whereClause.status = status as any;
  }
  if (reservationId) {
    whereClause.reservationId = reservationId;
  }
  if (search) {
    whereClause.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { reservation: { bookingCode: { contains: search, mode: 'insensitive' } } },
      { reservation: { guest: { fullName: { contains: search, mode: 'insensitive' } } } },
      { reservation: { room: { roomNumber: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const [data, total] = await Promise.all([
    penaltyRepository.findAll({
      where: whereClause,
      include: WITH_RESERVATION,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    penaltyRepository.count({ where: whereClause }),
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

export async function getPenaltyById(id: string) {
  return penaltyRepository.findById(id, { include: WITH_RESERVATION });
}

export async function createPenalty(body: PenaltyInput, userId?: string | null) {
  return dbRepository.transaction(async (tx) => {
    const reservation = await reservationRepository.findById(
      body.reservationId,
      { include: { guest: true, room: true, transaction: true } },
      tx,
    );
    if (!reservation) {
      throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
    }

    const amount = toDecimal(body.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw Object.assign(new Error('Jumlah denda harus lebih dari 0'), { statusCode: 400 });
    }

    const penalty = await penaltyRepository.create(
      {
        data: {
          reservationId: body.reservationId,
          type: (body.type as any) || 'other',
          amount,
          description: body.description,
          notes: body.notes ?? null,
          status: 'pending',
          createdByUserId: userId ?? null,
        },
        include: WITH_RESERVATION,
      },
      tx,
    );

    // Sync transaction amount + income whenever a penalty is created
    await syncPenaltyToTransaction(tx, reservation, penalty, 'add', userId ?? null);

    return penalty;
  });
}

export async function updatePenalty(id: string, body: Partial<PenaltyInput>, userId?: string | null) {
  return dbRepository.transaction(async (tx) => {
    const existing = await penaltyRepository.findById(id, { include: { reservation: { include: { guest: true, room: true, transaction: true } } } }, tx);
    if (!existing) {
      throw Object.assign(new Error('Penalty not found'), { statusCode: 404 });
    }

    const newAmount = body.amount !== undefined ? toDecimal(body.amount) : (existing.amount as Prisma.Decimal);
    if (newAmount.lessThanOrEqualTo(0)) {
      throw Object.assign(new Error('Jumlah denda harus lebih dari 0'), { statusCode: 400 });
    }

    const oldAmount = existing.amount as Prisma.Decimal;
    const diff = newAmount.minus(oldAmount);

    const updated = await penaltyRepository.update(
      id,
      {
        data: {
          ...(body.type !== undefined ? { type: body.type as any } : {}),
          ...(body.amount !== undefined ? { amount: newAmount } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          ...(body.status !== undefined ? { status: body.status as any } : {}),
        },
        include: WITH_RESERVATION,
      },
      tx,
    );

    if (!diff.equals(0)) {
      await applyAmountDelta(tx, (existing as any).reservation, diff, updated, userId ?? null);
    }

    return updated;
  });
}

export async function deletePenalty(id: string) {
  return dbRepository.transaction(async (tx) => {
    const existing = await penaltyRepository.findById(
      id,
      { include: { reservation: { include: { guest: true, room: true, transaction: true } } } },
      tx,
    );
    if (!existing) {
      throw Object.assign(new Error('Penalty not found'), { statusCode: 404 });
    }

    await syncPenaltyToTransaction(tx, (existing as any).reservation, existing as any, 'remove', null);
    await penaltyRepository.delete(id, tx);
    return { success: true };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function syncPenaltyToTransaction(
  tx: any,
  reservation: any,
  penalty: any,
  mode: 'add' | 'remove',
  userId: string | null,
) {
  const trx = reservation.transaction;
  if (!trx) return; // No transaction to sync (skip silently)

  const amount = penalty.amount as Prisma.Decimal;
  const delta = mode === 'add' ? amount : amount.negated();
  await applyAmountDelta(tx, reservation, delta, penalty, userId);
}

async function applyAmountDelta(
  tx: any,
  reservation: any,
  delta: Prisma.Decimal,
  penalty: any,
  userId: string | null,
) {
  const trx = reservation.transaction;
  if (!trx) return;

  const newAmount = (trx.amount as Prisma.Decimal).plus(delta);
  await transactionRepository.update(
    trx.id,
    { data: { amount: newAmount } },
    tx,
  );

  // If transaction is paid, sync the linked income entry as well
  if (trx.paymentStatus === 'paid') {
    const income = await incomeRepository.findByTransactionId(trx.id, undefined, tx);
    if (income) {
      const newIncome = (income.amount as Prisma.Decimal).plus(delta);
      await incomeRepository.update(
        income.id,
        {
          data: {
            amount: newIncome,
            description: appendPenaltyNote(
              income.description ?? '',
              penalty,
              delta.isPositive() ? 'add' : 'remove',
            ),
          },
        },
        tx,
      );
    } else {
      // No income exists yet (edge case) - create one to capture penalty as income
      await incomeRepository.create(
        {
          data: {
            transactionId: trx.id,
            amount: delta,
            description: `${PENALTY_LABEL[penalty.type] || 'Denda'} - ${penalty.description}`,
            userId: userId ?? null,
            incomeDate: new Date(),
            sourceType: 'RESERVATION',
            referenceId: reservation.id,
            paymentMethod: trx.paymentMethod,
            status: 'paid',
            guestNameSnapshot: reservation.guest?.fullName,
            roomNumberSnapshot: reservation.room?.roomNumber,
            type: 'income',
          },
        },
        tx,
      );
    }
  }
}

function appendPenaltyNote(description: string, penalty: any, mode: 'add' | 'remove'): string {
  const label = PENALTY_LABEL[penalty.type] || 'Denda';
  const sign = mode === 'add' ? '+' : '-';
  const line = `${sign} ${label}: ${penalty.description}`;
  if (!description) return line;
  return `${description}\n${line}`;
}
