import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const reservationRepository = {
  findAll: (args?: Prisma.ReservationFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.reservation.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (id: string, args?: Omit<Prisma.ReservationFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.reservation.findUnique({ where: { id }, ...args }),

  create: (args: Prisma.ReservationCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.reservation.create(args),

  update: (id: string, args: Omit<Prisma.ReservationUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.reservation.update({ where: { id }, ...args }),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.reservation.delete({ where: { id } }),

  count: (args?: Prisma.ReservationCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.reservation.count(args),
};
